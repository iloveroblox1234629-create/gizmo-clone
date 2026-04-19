"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore, Deck, Question } from '@/lib/store';
import { CardSRSData, createInitialCardData } from '@/lib/srs';
import SettingsMenu from '@/components/SettingsMenu';
import { Sparkles, Play, Loader2, Heart, Flame, Trophy, FileText, Upload, LogOut } from 'lucide-react';

const STORAGE_USERS_KEY = 'gizmo_users';
const STORAGE_CURRENT_USER_KEY = 'gizmo_current_user';

interface User {
  id: string;
  username: string;
  createdAt: number;
}

const YoutubeIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.013 3.013 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.013 3.013 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.013 3.013 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.013 3.013 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const YoutubeIconLarge = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.013 3.013 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.013 3.013 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.013 3.013 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.013 3.013 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const QuizletIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
  </svg>
);

const QuizletIconLarge = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
  </svg>
);

const AnkiIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
  </svg>
);

const AnkiIconLarge = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
  </svg>
);

const PowerPointIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
  </svg>
);

const PowerPointIconLarge = () => (
  <svg className="w-16 h-16 text-on-surface-variant/30" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
  </svg>
);

function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;
  const userId = localStorage.getItem(STORAGE_CURRENT_USER_KEY);
  if (!userId) return null;
  const stored = localStorage.getItem(STORAGE_USERS_KEY);
  if (!stored) return null;
  const users: User[] = JSON.parse(stored);
  return users.find(u => u.id === userId) || null;
}

function getUserDecks(userId: string): Deck[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem('gizmo_state');
  if (!stored) return [];
  const state = JSON.parse(stored) as { decks?: Record<string, Deck> };
  if (!state.decks) return [];
  return Object.values(state.decks).filter((d) => d.userId === userId);
}

function deleteDeck(deckId: string) {
  const stored = localStorage.getItem('gizmo_state');
  if (!stored) return;
  const state = JSON.parse(stored);
  if (state.decks && state.decks[deckId]) {
    delete state.decks[deckId];
    localStorage.setItem('gizmo_state', JSON.stringify(state));
  }
}

export default function Dashboard() {
  const router = useRouter();
  const { state, saveDeck, checkAndUpdateStreak, createFolder, deleteFolder, renameFolder, moveDeckToFolder } = useStore();
  const [text, setText] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [quizType, setQuizType] = useState<'mixed' | 'mcq' | 'tf' | 'written' | 'short'>('mixed');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExtractingPDF, setIsExtractingPDF] = useState(false);
  const [pdfProgress, setPdfProgress] = useState('');
  const [isExtractingPPTX, setIsExtractingPPTX] = useState(false);
  const [pptxProgress, setPptxProgress] = useState('');
  const [importMode, setImportMode] = useState<'text' | 'youtube' | 'pdf' | 'pptx' | 'quizlet' | 'anki'>('text');
  const [videoTitle, setVideoTitle] = useState<string | null>(null);
  const [videoSummary, setVideoSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [deckName, setDeckName] = useState('');
  const [deckFolderId, setDeckFolderId] = useState<string | undefined>(undefined);
  const [userDecks, setUserDecks] = useState<Deck[]>([]);
  const [decksVersion, setDecksVersion] = useState(0);
  const [quizletData, setQuizletData] = useState('');
  const [quizletSeparator, setQuizletSeparator] = useState('\t');
  const [ankiData, setAnkiData] = useState('');
  const [showNewFolderForm, setShowNewFolderForm] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('#ff87be');

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.replace('/');
      return;
    }
    setHydrated(true);
    setUserDecks(getUserDecks(user.id));
  }, [router, decksVersion]);

  useEffect(() => {
    checkAndUpdateStreak();
  }, [checkAndUpdateStreak]);

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_CURRENT_USER_KEY);
    router.replace('/');
  };

  const handleDeleteDeck = (deckId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteDeck(deckId);
    setDecksVersion(v => v + 1);
  };

  const handleGenerate = async () => {
    if (!text.trim()) return;
    
    setIsGenerating(true);
    setError(null);
    
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          quizType,
          openaiKey: state.openAiKey,
          geminiKey: state.geminiKey,
        }),
      });

      const data = await response.json();

      const user = getCurrentUser();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate quiz');
      }

      const questions = data.questions.map((q: Question, i: number) => ({ ...q, id: `q-${i}` }));
      const cardSRSData: Record<string, CardSRSData> = {};
      for (const q of questions) {
        cardSRSData[q.id] = createInitialCardData(q.id);
      }

      const deckNameInput = deckName.trim() || videoTitle || 'New Study Session';
      const sourceType: 'text' | 'pdf' | 'youtube' | 'pptx' | 'quizlet' | 'anki' = importMode as any;
      
      const deck: Deck = {
        id: Date.now().toString(),
        userId: user!.id,
        name: deckNameInput,
        sourceType,
        questions,
        currentQuestionIndex: 0,
        completed: false,
        score: 0,
        createdAt: Date.now(),
        cardSRSData,
        folderId: deckFolderId,
      };

      saveDeck(deck);
      setVideoTitle(null);
      setDeckName('');
      setDeckFolderId(undefined);
      router.push(`/quiz/${deck.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleResume = () => {
    if (state.currentDeckId) {
      router.push(`/quiz/${state.currentDeckId}`);
    }
  };

  const handleYoutubeImport = async () => {
    if (!youtubeUrl.trim()) return;
    
    setIsGenerating(true);
    setError(null);
    setVideoTitle(null);
    setVideoSummary(null);
    setShowSummary(false);
    
    try {
      const response = await fetch('/api/youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: youtubeUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch YouTube video');
      }

      setVideoTitle(data.title);
      setText(data.transcript);
      setImportMode('youtube');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSummarizeVideo = async () => {
    if (!text.trim() || !videoTitle) return;
    
    setIsSummarizing(true);
    setError(null);
    
    try {
      const response = await fetch('/api/youtube', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: text,
          title: videoTitle,
          summarize: true,
          openaiKey: state.openAiKey,
          geminiKey: state.geminiKey,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate summary');
      }

      setVideoSummary(data.summary);
      setShowSummary(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleAddSummaryToQuiz = () => {
    if (!videoSummary) return;
    const combined = `## Video Summary\n${videoSummary}\n\n## Full Transcript\n${text}`;
    setText(combined);
    setShowSummary(false);
  };

  const handlePDFUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsExtractingPDF(true);
    setPdfProgress('Reading PDF...');
    setError(null);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      
      setPdfProgress('Extracting text...');
      const response = await fetch('/api/extract-pdf', {
        method: 'POST',
        body: arrayBuffer,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to extract text from PDF');
      }

      setPdfProgress('');
      setText(data.text);
      setImportMode('text');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setPdfProgress('');
    } finally {
      setIsExtractingPDF(false);
    }
  };

  const clearPDF = () => {
    setText('');
    setImportMode('text');
  };

  const handlePPTXUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsExtractingPPTX(true);
    setPptxProgress('Reading PowerPoint...');
    setError(null);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      
      setPptxProgress('Extracting slides...');
      const response = await fetch('/api/extract-pptx', {
        method: 'POST',
        body: arrayBuffer,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to extract text from PowerPoint');
      }

      setPptxProgress('');
      setText(data.text);
      setImportMode('text');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setPptxProgress('');
    } finally {
      setIsExtractingPPTX(false);
    }
  };

  const clearPPTX = () => {
    setText('');
    setImportMode('text');
  };

  if (!hydrated) {
    return null;
  }

  const currentUser = getCurrentUser();

  const DeckCard = ({ deck, onDelete, onMoveToFolder }: { deck: Deck; onDelete: (id: string, e: React.MouseEvent) => void; onMoveToFolder: () => void }) => (
    <div
      onClick={() => router.push(`/quiz/${deck.id}`)}
      className="glass-panel rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-surface-container-high/50 transition-all group"
    >
      <div className="flex-1">
        <div className="font-semibold text-on-surface">{deck.name}</div>
        <div className="text-sm text-on-surface-variant">
          {deck.sourceType} · {deck.questions.length} questions
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={(e) => { e.stopPropagation(); onMoveToFolder(); }}
          className="p-2 text-on-surface-variant hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
          title="Move to folder"
        >
          📁
        </button>
        <button
          onClick={(e) => onDelete(deck.id, e)}
          className="p-2 text-on-surface-variant hover:text-error opacity-0 group-hover:opacity-100 transition-opacity"
        >
          ×
        </button>
      </div>
    </div>
  );

  return (
    <main className="flex-1 flex flex-col p-6 max-w-lg mx-auto w-full relative z-10">
      <header className="flex justify-between items-center mb-10 pt-6">
        <h1 className="text-4xl font-display font-black flex items-center gap-3 text-primary tracking-tight">
          <Sparkles className="w-10 h-10 drop-shadow-[0_0_15px_rgba(255,135,190,0.5)]" />
          Gizmo
        </h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container rounded-full" title="Study Streak">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-bold text-on-surface">{state.streak}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container rounded-full" title="Lives">
            <Heart className="w-4 h-4 text-error" />
            <span className="text-sm font-bold text-on-surface">{state.lives}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container rounded-full" title="XP">
            <Trophy className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-on-surface">{state.totalXp}</span>
          </div>
          <SettingsMenu />
          <button
            onClick={handleLogout}
            className="p-2 text-on-surface-variant hover:text-error transition-colors"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="text-center mb-4">
        <p className="text-on-surface-variant">
          Welcome back, <span className="text-primary font-bold">{currentUser?.username}</span>
        </p>
      </div>

      <div className="glass-panel rounded-[2rem] p-4 mb-6 space-y-4">
        <h3 className="text-lg font-display font-bold text-on-surface">Create New Deck</h3>
        
        <div className="flex gap-2">
          <input
            type="text"
            value={deckName}
            onChange={(e) => setDeckName(e.target.value)}
            placeholder="Deck name..."
            className="flex-1 bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/50 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Folder selector */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-on-surface-variant">Folder:</label>
          <select
            value={deckFolderId || ''}
            onChange={(e) => setDeckFolderId(e.target.value || undefined)}
            className="flex-1 bg-surface-container-low text-on-surface rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-primary/50 max-w-xs"
          >
            <option value="">No folder</option>
            {Object.values(state.folders)
              .sort((a, b) => a.createdAt - b.createdAt)
              .map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
          </select>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          <button
            onClick={() => setImportMode('text')}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
              importMode === 'text' 
                ? 'bg-primary/20 text-primary border border-primary' 
                : 'bg-surface-container text-on-surface-variant border border-transparent hover:border-primary/50'
            }`}
          >
            <FileText className="w-4 h-4" />
            Text
          </button>
          <button
            onClick={() => setImportMode('pdf')}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
              importMode === 'pdf' 
                ? 'bg-primary/20 text-primary border border-primary' 
                : 'bg-surface-container text-on-surface-variant border border-transparent hover:border-primary/50'
            }`}
          >
            <FileText className="w-4 h-4" />
            PDF
          </button>
          <button
            onClick={() => setImportMode('youtube')}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
              importMode === 'youtube' 
                ? 'bg-primary/20 text-primary border border-primary' 
                : 'bg-surface-container text-on-surface-variant border border-transparent hover:border-primary/50'
            }`}
          >
            <YoutubeIcon />
            YouTube
          </button>
          <button
            onClick={() => setImportMode('quizlet')}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
              importMode === 'quizlet' 
                ? 'bg-primary/20 text-primary border border-primary' 
                : 'bg-surface-container text-on-surface-variant border border-transparent hover:border-primary/50'
            }`}
          >
            <QuizletIcon />
            Quizlet
          </button>
          <button
            onClick={() => setImportMode('anki')}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
              importMode === 'anki' 
                ? 'bg-primary/20 text-primary border border-primary' 
                : 'bg-surface-container text-on-surface-variant border border-transparent hover:border-primary/50'
            }`}
          >
            <AnkiIcon />
            Anki
          </button>

          <button
            onClick={() => setImportMode('pptx')}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
              importMode === 'pptx' 
                ? 'bg-primary/20 text-primary border border-primary' 
                : 'bg-surface-container text-on-surface-variant border border-transparent hover:border-primary/50'
            }`}
          >
            <PowerPointIcon />
            PowerPoint
          </button>
        </div>
      </div>

      {userDecks.length > 0 && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-display font-bold text-on-surface">Your Decks</h3>
            <button
              onClick={() => { setShowNewFolderForm(true); setNewFolderName(''); setNewFolderColor('#ff87be'); }}
              className="px-3 py-1 text-xs font-semibold bg-surface-container text-on-surface-variant rounded-full hover:bg-surface-container-high transition-colors"
            >
              + New Folder
            </button>
          </div>

          {/* Inline folder creation form */}
          {showNewFolderForm && (
            <div className="glass-panel rounded-xl p-4 mb-4 space-y-3 animate-in fade-in slide-in-from-top-2">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name"
                className="w-full bg-surface-container-low text-on-surface rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50"
                autoFocus
              />
              <div className="flex items-center gap-2">
                <span className="text-xs text-on-surface-variant">Color:</span>
                <div className="flex gap-2">
                  {['#ff87be', '#4fc3f7', '#81c784', '#ffb74d', '#ba68c8', '#e57373'].map(color => (
                    <button
                      key={color}
                      onClick={() => setNewFolderColor(color)}
                      className={`w-6 h-6 rounded-full transition-transform ${newFolderColor === color ? 'scale-110 ring-2 ring-primary' : ''}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (newFolderName.trim()) {
                      createFolder(newFolderName.trim(), newFolderColor);
                      setDecksVersion(v => v + 1);
                      setShowNewFolderForm(false);
                      setNewFolderName('');
                    }
                  }}
                  className="flex-1 py-2 bg-primary text-on-primary font-medium rounded-lg"
                >
                  Create
                </button>
                <button
                  onClick={() => setShowNewFolderForm(false)}
                  className="px-4 py-2 text-on-surface-variant hover:text-error"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          
          {/* Group decks by folder */}
          <div className="space-y-4">
            {/* Decks without folder */}
            {userDecks.filter(d => !d.folderId).length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-surface-container" />
                  <span className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider">Ungrouped</span>
                  <span className="text-xs text-on-surface-variant">({userDecks.filter(d => !d.folderId).length})</span>
                </div>
                <div className="grid gap-2">
                  {userDecks.filter(d => !d.folderId).map((deck) => (
                    <DeckCard key={deck.id} deck={deck} onDelete={handleDeleteDeck} onMoveToFolder={() => {
                      const folderId = prompt('Move to folder ID (or empty to ungroup):');
                      if (folderId !== null) {
                        moveDeckToFolder(deck.id, folderId || undefined);
                        setDecksVersion(v => v + 1);
                      }
                    }} />
                  ))}
                </div>
              </div>
            )}

            {/* Foldered decks */}
            {Object.values(state.folders)
              .sort((a, b) => a.createdAt - b.createdAt)
              .map((folder) => {
                const folderDecks = userDecks.filter(d => d.folderId === folder.id);
                if (folderDecks.length === 0) return null;
                return (
                  <div key={folder.id}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: folder.color }} />
                      <span className="text-sm font-semibold text-on-surface">{folder.name}</span>
                      <span className="text-xs text-on-surface-variant">({folderDecks.length})</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const newName = prompt('Rename folder:', folder.name);
                          if (newName && newName !== folder.name) {
                            renameFolder(folder.id, newName);
                            setDecksVersion(v => v + 1);
                          }
                        }}
                        className="ml-auto text-xs text-primary hover:underline"
                      >
                        Rename
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Delete folder? Decks will be ungrouped.')) {
                            deleteFolder(folder.id);
                            setDecksVersion(v => v + 1);
                          }
                        }}
                        className="text-xs text-error hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                    <div className="grid gap-2 pl-5">
                      {folderDecks.map((deck) => (
                        <DeckCard key={deck.id} deck={deck} onDelete={handleDeleteDeck} onMoveToFolder={() => {
                          const folderId = prompt('Move to folder ID (or empty to ungroup):');
                          if (folderId !== null) {
                            moveDeckToFolder(deck.id, folderId || undefined);
                            setDecksVersion(v => v + 1);
                          }
                        }} />
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col justify-center space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-display font-bold text-on-surface">
            What shall we study?
          </h2>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          <button
            onClick={() => setImportMode('text')}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
              importMode === 'text' 
                ? 'bg-primary/20 text-primary border border-primary' 
                : 'bg-surface-container text-on-surface-variant border border-transparent hover:border-primary/50'
            }`}
          >
            <FileText className="w-4 h-4" />
            Text
          </button>
          <button
            onClick={() => setImportMode('pdf')}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
              importMode === 'pdf' 
                ? 'bg-primary/20 text-primary border border-primary' 
                : 'bg-surface-container text-on-surface-variant border border-transparent hover:border-primary/50'
            }`}
          >
            <FileText className="w-4 h-4" />
            PDF
          </button>
          <button
            onClick={() => setImportMode('pptx')}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
              importMode === 'pptx' 
                ? 'bg-primary/20 text-primary border border-primary' 
                : 'bg-surface-container text-on-surface-variant border border-transparent hover:border-primary/50'
            }`}
          >
            <PowerPointIcon />
            PowerPoint
          </button>
          <button
            onClick={() => { setImportMode('youtube'); setError(null); }}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
              importMode === 'youtube' 
                ? 'bg-primary/20 text-primary border border-primary' 
                : 'bg-surface-container text-on-surface-variant border border-transparent hover:border-primary/50'
            }`}
          >
            <YoutubeIcon />
            YouTube
          </button>
          <button
            onClick={() => setImportMode('quizlet')}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
              importMode === 'quizlet' 
                ? 'bg-primary/20 text-primary border border-primary' 
                : 'bg-surface-container text-on-surface-variant border border-transparent hover:border-primary/50'
            }`}
          >
            <QuizletIcon />
            Quizlet
          </button>
          <button
            onClick={() => setImportMode('anki')}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
              importMode === 'anki' 
                ? 'bg-primary/20 text-primary border border-primary' 
                : 'bg-surface-container text-on-surface-variant border border-transparent hover:border-primary/50'
            }`}
          >
            <AnkiIcon />
            Anki
          </button>
        </div>

        {importMode === 'pdf' && !text && (
          <div className="glass-panel rounded-[2rem] p-8 flex flex-col items-center justify-center text-center space-y-4">
            <FileText className="w-16 h-16 text-on-surface-variant/30" />
            <div>
              <p className="text-on-surface-variant font-body mb-4">
                Upload a PDF to extract text for quiz generation
              </p>
              <label className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-full font-bold cursor-pointer hover:bg-primary/90 transition-all">
                <Upload className="w-5 h-5" />
                Select PDF
                <input 
                  type="file" 
                  accept=".pdf,application/pdf" 
                  onChange={handlePDFUpload}
                  disabled={isExtractingPDF}
                  className="sr-only"
                />
              </label>
            </div>
            {isExtractingPDF && (
              <div className="flex items-center gap-2 text-primary">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm font-semibold">{pdfProgress}</span>
              </div>
            )}
          </div>
        )}

        {importMode === 'pdf' && text && (
          <div className="glass-panel rounded-[2rem] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary font-semibold">
                <FileText className="w-5 h-5" />
                PDF Content Loaded
              </div>
              <button
                onClick={clearPDF}
                className="text-sm text-on-surface-variant hover:text-error transition-colors"
              >
                Clear
              </button>
            </div>
            <p className="text-sm text-on-surface-variant">
              {text.length} characters extracted
            </p>
          </div>
        )}

        {importMode === 'pptx' && !text && (
          <div className="glass-panel rounded-[2rem] p-8 flex flex-col items-center justify-center text-center space-y-4">
            <PowerPointIconLarge />
            <div>
              <p className="text-on-surface-variant font-body mb-4">
                Upload a PowerPoint file to extract text for quiz generation
              </p>
              <label className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-full font-bold cursor-pointer hover:bg-primary/90 transition-all">
                <Upload className="w-5 h-5" />
                Select PowerPoint
                <input 
                  type="file" 
                  accept=".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation" 
                  onChange={handlePPTXUpload}
                  disabled={isExtractingPPTX}
                  className="sr-only"
                />
              </label>
            </div>
            {isExtractingPPTX && (
              <div className="flex items-center gap-2 text-primary">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm font-semibold">{pptxProgress}</span>
              </div>
            )}
          </div>
        )}

        {importMode === 'pptx' && text && (
          <div className="glass-panel rounded-[2rem] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary font-semibold">
                <PowerPointIconLarge />
                PowerPoint Content Loaded
              </div>
              <button
                onClick={clearPPTX}
                className="text-sm text-on-surface-variant hover:text-error transition-colors"
              >
                Clear
              </button>
            </div>
            <p className="text-sm text-on-surface-variant">
              {text.length} characters extracted
            </p>
          </div>
        )}

        {importMode === 'youtube' && !videoTitle && (
          <div className="glass-panel rounded-[2rem] p-6 space-y-4">
            <input
              type="url"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="Paste YouTube URL here..."
              className="w-full bg-transparent text-on-surface placeholder:text-on-surface-variant/50 outline-none font-body"
              disabled={isGenerating}
            />
            <button
              onClick={handleYoutubeImport}
              disabled={!youtubeUrl.trim() || isGenerating}
              className="w-full py-3 bg-surface-container-high text-on-surface font-bold rounded-xl hover:bg-surface-container-high/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Fetching...
                </>
              ) : (
                <>
                  <YoutubeIconLarge />
                  Import Video
                </>
              )}
            </button>
            {error && (
              <div className="text-center text-error text-sm">
                {error}
              </div>
            )}
          </div>
        )}

        {importMode === 'youtube' && videoTitle && (
          <div className="glass-panel rounded-[2rem] p-4 space-y-3">
            <div className="flex items-center gap-2 text-primary font-semibold">
              <YoutubeIconLarge />
              {videoTitle}
            </div>
            
            {showSummary && videoSummary && (
              <div className="mt-4 p-4 bg-surface-container-low rounded-xl space-y-3">
                <div className="text-sm font-bold text-on-surface">AI Summary</div>
                <div className="text-sm text-on-surface whitespace-pre-wrap max-h-48 overflow-y-auto">{videoSummary}</div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleAddSummaryToQuiz}
                    className="flex-1 py-2 bg-primary text-on-primary font-medium rounded-lg hover:opacity-90 transition-all flex justify-center items-center gap-2 text-sm"
                  >
                    <Sparkles className="w-4 h-4" />
                    Add to Quiz
                  </button>
                  <button
                    onClick={() => setShowSummary(false)}
                    className="px-3 py-2 text-on-surface-variant hover:text-error text-sm"
                  >
                    Hide
                  </button>
                </div>
              </div>
            )}
            
            <div className="flex gap-2">
              <button
                onClick={handleSummarizeVideo}
                disabled={isSummarizing || !text.trim()}
                className="flex-1 py-2 bg-surface-variant text-on-surface font-medium rounded-lg hover:bg-surface-variant/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 text-sm"
              >
                {isSummarizing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Summarizing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    AI Summary
                  </>
                )}
              </button>
            </div>
            
            <p className="text-sm text-on-surface-variant">
              {text.length} characters imported
            </p>
            <button
              onClick={() => { setVideoTitle(null); setText(''); setYoutubeUrl(''); setImportMode('text'); setVideoSummary(null); setShowSummary(false); }}
              className="text-sm text-primary hover:underline"
            >
              Clear and try another
            </button>
          </div>
        )}

        {importMode === 'quizlet' && (
          <div className="glass-panel rounded-[2rem] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary font-semibold">
                <QuizletIconLarge />
                Quizlet Import
              </div>
            </div>
            <input
              type="text"
              value={quizletSeparator}
              onChange={(e) => setQuizletSeparator(e.target.value)}
              placeholder="Separator (default: tab)..."
              className="w-full bg-transparent text-on-surface placeholder:text-on-surface-variant/50 outline-none font-body"
            />
            <textarea
              value={quizletData}
              onChange={(e) => setQuizletData(e.target.value)}
              placeholder="Paste Quizlet data here..."
              className="w-full h-48 bg-transparent text-on-surface placeholder:text-on-surface-variant/50 resize-none outline-none font-body text-lg leading-relaxed"
            />
            <button
              onClick={() => {
                const lines = quizletData.split('\n');
                const questions: Question[] = lines.filter(l => l.trim()).map((l, i) => {
                  const [term, def] = l.split(quizletSeparator || '\t');
                  return {
                    id: `q-${i}`,
                    type: 'written',
                    text: term,
                    options: [],
                    correctAnswerIndex: 0,
                    sampleAnswer: def
                  };
                });
                const deck: Deck = {
                  id: Date.now().toString(),
                  userId: getCurrentUser()!.id,
                  name: deckName || 'Quizlet Import',
                  sourceType: 'quizlet',
                  questions,
                  currentQuestionIndex: 0,
                  completed: false,
                  score: 0,
                  createdAt: Date.now(),
                  cardSRSData: questions.reduce((acc, q) => ({ ...acc, [q.id]: createInitialCardData(q.id) }), {}),
                  folderId: deckFolderId,
                };
                saveDeck(deck);
                setDeckFolderId(undefined);
                router.push(`/quiz/${deck.id}`);
              }}
              className="w-full py-3 bg-primary text-on-primary font-bold rounded-xl"
            >
              Import Quizlet
            </button>
          </div>
        )}

        {importMode === 'anki' && (
          <div className="glass-panel rounded-[2rem] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary font-semibold">
                <AnkiIconLarge />
                Anki Import
              </div>
            </div>
            <textarea
              value={ankiData}
              onChange={(e) => setAnkiData(e.target.value)}
              placeholder="Paste Anki CSV export here..."
              className="w-full h-48 bg-transparent text-on-surface placeholder:text-on-surface-variant/50 resize-none outline-none font-body text-lg leading-relaxed"
            />
            <button
              onClick={() => {
                const lines = ankiData.split('\n');
                const questions: Question[] = lines.filter(l => l.trim()).map((l, i) => {
                  const [front, back] = l.split(',');
                  return {
                    id: `q-${i}`,
                    type: 'written',
                    text: front,
                    options: [],
                    correctAnswerIndex: 0,
                    sampleAnswer: back
                  };
                });
                const deck: Deck = {
                  id: Date.now().toString(),
                  userId: getCurrentUser()!.id,
                  name: deckName || 'Anki Import',
                  sourceType: 'anki',
                  questions,
                  currentQuestionIndex: 0,
                  completed: false,
                  score: 0,
                  createdAt: Date.now(),
                  cardSRSData: questions.reduce((acc, q) => ({ ...acc, [q.id]: createInitialCardData(q.id) }), {}),
                  folderId: deckFolderId,
                };
                saveDeck(deck);
                setDeckFolderId(undefined);
                router.push(`/quiz/${deck.id}`);
              }}
              className="w-full py-3 bg-primary text-on-primary font-bold rounded-xl"
            >
              Import Anki
            </button>
          </div>
        )}

        {(importMode === 'text' || (importMode === 'pdf' && text) || (importMode === 'pptx' && text) || (importMode === 'youtube' && text)) && (
          <div className="glass-panel rounded-[2rem] p-6 focus-within:ring-2 focus-within:ring-primary/50 transition-all focus-glow relative">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste your notes here..."
              className="w-full h-48 bg-transparent text-on-surface placeholder:text-on-surface-variant/50 resize-none outline-none font-body text-lg leading-relaxed"
              disabled={isGenerating}
            />
            {error && importMode !== 'youtube' && (
              <div className="absolute -bottom-10 left-0 right-0 text-center text-error text-sm px-2 bg-error/10 py-2 rounded-xl backdrop-blur-sm border border-error/20">
                {error}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3 flex-wrap">
          {(['mixed', 'mcq', 'tf', 'written', 'short'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setQuizType(type)}
              disabled={isGenerating}
              className={`flex-1 py-3 px-2 text-sm md:text-base rounded-2xl font-bold transition-all border min-w-[100px] ${
                quizType === type
                  ? 'bg-primary/20 text-primary border-primary shadow-[0_0_15px_rgba(255,135,190,0.15)]'
                  : 'bg-surface-container-low text-on-surface-variant border-outline-variant/30 hover:border-primary/50'
              }`}
            >
              {type === 'mixed' ? 'Mixed' : type === 'mcq' ? 'Multiple Choice' : type === 'tf' ? 'True/False' : type === 'written' ? 'Written' : 'Short Answer'}
            </button>
          ))}
        </div>

        <button
          onClick={handleGenerate}
          disabled={!text.trim() || isGenerating}
          className="mt-4 py-5 px-8 w-full gradient-primary text-on-primary font-bold text-xl rounded-full glow-hover disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-3 shadow-[0_10px_30px_rgba(255,135,190,0.3)]"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              Generating...
            </>
          ) : (
            'Generate Quiz'
          )}
        </button>
      </div>

      {state.currentDeckId && state.decks[state.currentDeckId] && !state.decks[state.currentDeckId].completed && (
        <div className="pb-8 animate-in slide-in-from-bottom-4 duration-500 fade-in">
          <button
            onClick={handleResume}
            className="w-full py-5 px-6 glass-panel rounded-[1.5rem] flex items-center justify-between hover:bg-surface-container-high transition-colors border border-outline-variant group"
          >
            <span className="flex items-center gap-3 font-semibold text-primary group-hover:text-primary-container transition-colors">
              <Play className="w-6 h-6 fill-primary/20 group-hover:fill-primary/40 transition-colors" />
              Resume Last Session
            </span>
            <span className="text-on-surface-variant text-sm font-bold bg-surface px-3 py-1 rounded-full shadow-inner">
              {Math.round((state.decks[state.currentDeckId].currentQuestionIndex / state.decks[state.currentDeckId].questions.length) * 100)}%
            </span>
          </button>
        </div>
      )}
    </main>
  );
}
