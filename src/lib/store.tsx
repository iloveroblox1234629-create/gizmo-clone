"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { CardSRSData, Rating, createInitialCardData, calculateSM2 } from './srs';

export interface Question {
  id: string;
  type: 'mcq' | 'tf' | 'written' | 'short';
  text: string;
  options: string[]; // For MCQ/TF, the choices. For written/short, sample acceptable answers
  correctAnswerIndex: number;
  sampleAnswer?: string; // The correct answer for written/short questions
}

export interface Deck {
  id: string;
  userId: string;
  name: string;
  sourceType: 'text' | 'pdf' | 'youtube' | 'pptx' | 'quizlet' | 'anki';
  questions: Question[];
  currentQuestionIndex: number;
  completed: boolean;
  score: number;
  createdAt: number;
  cardSRSData: Record<string, CardSRSData>;
  folderId?: string;
}

export interface Folder {
  id: string;
  userId: string;
  name: string;
  color: string;
  createdAt: number;
}

export interface GizmoState {
  decks: Record<string, Deck>;
  folders: Record<string, Folder>;
  currentDeckId: string | null;
  totalXp: number;
  lives: number;
  streak: number;
  lastStudyDate: string | null;
  correctStreak: number;
  openAiKey: string | null;
  geminiKey: string | null;
  themeColor: string;
  cardSRSData: Record<string, Record<string, CardSRSData>>;
  currentUser: { id: string; username: string; createdAt: number } | null;
}

const initialState: GizmoState = {
  decks: {},
  folders: {},
  currentDeckId: null,
  totalXp: 0,
  lives: 3,
  streak: 0,
  lastStudyDate: null,
  correctStreak: 0,
  openAiKey: null,
  geminiKey: null,
  themeColor: '#ff87be',
  cardSRSData: {},
  currentUser: null,
};

interface StoreContextType {
  state: GizmoState;
  saveDeck: (deck: Deck) => void;
  setCurrentDeck: (id: string | null) => void;
  updateDeckProgress: (deckId: string, questionIndex: number, scoreIncrement: number) => void;
  setKeys: (openai: string | null, gemini: string | null) => void;
  addXp: (amount: number) => void;
  deleteDeck: (id: string) => void;
  setThemeColor: (color: string) => void;
  loseLife: () => void;
  restoreLife: () => void;
  incrementCorrectStreak: () => void;
  resetCorrectStreak: () => void;
  checkAndUpdateStreak: () => void;
  recordReview: (deckId: string, questionId: string, rating: Rating) => void;
  getDueCards: (deckId: string) => CardSRSData[];
  createFolder: (name: string, color?: string) => Folder;
  deleteFolder: (id: string) => void;
  renameFolder: (id: string, name: string) => void;
  moveDeckToFolder: (deckId: string, folderId?: string) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GizmoState>(initialState);
  const [isLoaded, setIsLoaded] = useState(false);

   // Load from local storage
   useEffect(() => {
     try {
       const stored = localStorage.getItem('gizmo_state');
       if (stored) {
         const parsed = JSON.parse(stored);
         // Ensure all required state properties exist by merging with initialState
         setState({ ...initialState, ...parsed, folders: { ...initialState.folders, ...parsed.folders } });
       }
     } catch (e) {
       console.error('Failed to load state', e);
     }
     setIsLoaded(true);
   }, []);


  // Update CSS variables when themeColor changes
  useEffect(() => {
    if (isLoaded && state.themeColor) {
      const hex = state.themeColor.replace('#', '');
      if (hex.length === 6) {
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        
        const root = document.documentElement;
        root.style.setProperty('--app-primary', state.themeColor);
        // We'll use the same color for the container for simplicity, or slightly dim it
        root.style.setProperty('--app-primary-container', state.themeColor);
        root.style.setProperty('--app-primary-rgb', `${r}, ${g}, ${b}`);
      }
    }
  }, [state.themeColor, isLoaded]);

  // Save to local storage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('gizmo_state', JSON.stringify(state));
    }
  }, [state, isLoaded]);

  const saveDeck = (deck: Deck) => {
    setState((prev) => ({
      ...prev,
      decks: { ...prev.decks, [deck.id]: deck },
      currentDeckId: deck.id,
    }));
  };

  const setCurrentDeck = (id: string | null) => {
    setState((prev) => ({ ...prev, currentDeckId: id }));
  };

  const updateDeckProgress = (deckId: string, questionIndex: number, scoreIncrement: number) => {
    setState((prev) => {
      const deck = prev.decks[deckId];
      if (!deck) return prev;
      
      const isCompleted = questionIndex >= deck.questions.length;
      
      return {
        ...prev,
        decks: {
          ...prev.decks,
          [deckId]: {
            ...deck,
            currentQuestionIndex: isCompleted ? deck.currentQuestionIndex : questionIndex,
            completed: isCompleted,
            score: deck.score + scoreIncrement,
          },
        },
      };
    });
  };

  const addXp = (amount: number) => {
    setState((prev) => ({ ...prev, totalXp: prev.totalXp + amount }));
  };

  const setKeys = (openai: string | null, gemini: string | null) => {
    setState((prev) => ({ ...prev, openAiKey: openai, geminiKey: gemini }));
  };
  
  const deleteDeck = (id: string) => {
    setState((prev) => {
      const newDecks = { ...prev.decks };
      delete newDecks[id];
      return {
        ...prev,
        decks: newDecks,
        currentDeckId: prev.currentDeckId === id ? null : prev.currentDeckId,
      };
    });
  }

const setThemeColor = (color: string) => {
    setState((prev) => ({ ...prev, themeColor: color }));
  };

  const loseLife = () => {
    setState((prev) => ({
      ...prev,
      lives: Math.max(0, prev.lives - 1),
      correctStreak: 0,
    }));
  };

  const restoreLife = () => {
    setState((prev) => ({
      ...prev,
      lives: Math.min(3, prev.lives + 1),
    }));
  };

  const incrementCorrectStreak = () => {
    setState((prev) => {
      const newStreak = prev.correctStreak + 1;
      if (newStreak >= 3) {
        return {
          ...prev,
          correctStreak: 0,
          lives: Math.min(3, prev.lives + 1),
        };
      }
      return {
        ...prev,
        correctStreak: newStreak,
      };
    });
  };

  const resetCorrectStreak = () => {
    setState((prev) => ({ ...prev, correctStreak: 0 }));
  };

  const checkAndUpdateStreak = () => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    setState((prev) => {
      if (prev.lastStudyDate === today) {
        return prev;
      }
      if (prev.lastStudyDate === yesterday) {
        return {
          ...prev,
          lastStudyDate: today,
          streak: prev.streak + 1,
        };
      }
      if (prev.lastStudyDate === null) {
        return {
          ...prev,
          lastStudyDate: today,
          streak: 1,
        };
      }
      return {
        ...prev,
        lastStudyDate: today,
        streak: 1,
      };
    });
  };

  const recordReview = (deckId: string, questionId: string, rating: Rating) => {
    setState((prev) => {
      const deck = prev.decks[deckId];
      if (!deck) return prev;

      const cardData = deck.cardSRSData?.[questionId] || createInitialCardData(questionId);
      const sm2Result = calculateSM2(cardData, rating);
      const reviewRecord = {
        date: new Date().toISOString(),
        rating,
      };

      return {
        ...prev,
        decks: {
          ...prev.decks,
          [deckId]: {
            ...deck,
            cardSRSData: {
              ...deck.cardSRSData,
              [questionId]: {
                ...cardData,
                ...sm2Result,
                lastReview: new Date().toISOString(),
                reviewHistory: [...cardData.reviewHistory, reviewRecord],
              },
            },
          },
        },
      };
    });
  };

  const getDueCards = (deckId: string): CardSRSData[] => {
    const deck = state.decks[deckId];
    if (!deck?.cardSRSData) return [];

    const now = new Date();
    now.setHours(23, 59, 59, 999);

    return Object.values(deck.cardSRSData).filter((card) => {
      if (!card.nextReview) return false;
      return new Date(card.nextReview) <= now;
    });
  };

  const createFolder = (name: string, color: string = '#ff87be'): Folder => {
    const folder: Folder = {
      id: `folder-${Date.now()}`,
      userId: state.currentUser!.id,
      name,
      color,
      createdAt: Date.now(),
    };
    setState((prev) => ({
      ...prev,
      folders: { ...prev.folders, [folder.id]: folder },
    }));
    return folder;
  };

  const deleteFolder = (id: string) => {
    setState((prev) => {
      const newFolders = { ...prev.folders };
      delete newFolders[id];
      // Remove folderId from decks in that folder
      const newDecks = { ...prev.decks };
      Object.values(newDecks).forEach((deck) => {
        if (deck.folderId === id) {
          delete deck.folderId;
        }
      });
      return {
        ...prev,
        folders: newFolders,
        decks: newDecks,
      };
    });
  };

  const renameFolder = (id: string, name: string) => {
    setState((prev) => {
      const folder = prev.folders[id];
      if (!folder) return prev;
      return {
        ...prev,
        folders: {
          ...prev.folders,
          [id]: { ...folder, name },
        },
      };
    });
  };

  const moveDeckToFolder = (deckId: string, folderId?: string) => {
    setState((prev) => {
      const deck = prev.decks[deckId];
      if (!deck) return prev;
      return {
        ...prev,
        decks: {
          ...prev.decks,
          [deckId]: { ...deck, folderId },
        },
      };
    });
  };

  const loadingState: StoreContextType = {
  state: { ...initialState, folders: {} },
  saveDeck: () => {},
  setCurrentDeck: () => {},
  updateDeckProgress: () => {},
  setKeys: () => {},
  addXp: () => {},
  deleteDeck: () => {},
  setThemeColor: () => {},
  loseLife: () => {},
  restoreLife: () => {},
  incrementCorrectStreak: () => {},
  resetCorrectStreak: () => {},
  checkAndUpdateStreak: () => {},
  recordReview: () => [],
  getDueCards: () => [],
  createFolder: () => ({ id: '', userId: '', name: '', color: '', createdAt: 0 }),
  deleteFolder: () => {},
  renameFolder: () => {},
  moveDeckToFolder: () => {},
};

const contextValue = isLoaded 
  ? { state, saveDeck, setCurrentDeck, updateDeckProgress, setKeys, addXp, deleteDeck, setThemeColor, loseLife, restoreLife, incrementCorrectStreak, resetCorrectStreak, checkAndUpdateStreak, recordReview, getDueCards, createFolder, deleteFolder, renameFolder, moveDeckToFolder }
  : loadingState;

return (
    <StoreContext.Provider value={contextValue}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
