"use client";

export interface ReviewRecord {
  date: string;
  rating: Rating;
}

export type Rating = 'again' | 'hard' | 'good' | 'easy';

export interface CardSRSData {
  questionId: string;
  easeFactor: number;
  interval: number;
  repetitions: number;
  lastReview: string | null;
  nextReview: string | null;
  reviewHistory: ReviewRecord[];
}

export const RATING_VALUES: Record<Rating, number> = {
  again: 0,
  hard: 3,
  good: 4,
  easy: 5,
};

export function calculateSM2(
  card: CardSRSData,
  rating: Rating
): Pick<CardSRSData, 'easeFactor' | 'interval' | 'repetitions' | 'nextReview'> {
  const quality = RATING_VALUES[rating];
  const now = new Date();
  let { easeFactor, interval, repetitions } = card;

  if (quality < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  }

  easeFactor = Math.max(
    1.3,
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  const nextDate = new Date(now);
  nextDate.setDate(nextDate.getDate() + interval);

  return {
    easeFactor,
    interval,
    repetitions,
    nextReview: nextDate.toISOString().split('T')[0],
  };
}

export function getCardDueStatus(card: CardSRSData): 'due' | 'new' | 'learning' {
  if (!card.lastReview) return 'new';
  if (!card.nextReview) return 'new';

  const now = new Date();
  const next = new Date(card.nextReview);
  return next <= now ? 'due' : 'learning';
}

export function getCardsByStatus(
  cards: CardSRSData[]
): { due: CardSRSData[]; newCards: CardSRSData[]; learning: CardSRSData[] } {
  const due: CardSRSData[] = [];
  const newCards: CardSRSData[] = [];
  const learning: CardSRSData[] = [];

  for (const card of cards) {
    const status = getCardDueStatus(card);
    if (status === 'due') due.push(card);
    else if (status === 'new') newCards.push(card);
    else learning.push(card);
  }

  return { due, newCards, learning };
}

export function createInitialCardData(questionId: string): CardSRSData {
  return {
    questionId,
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    lastReview: null,
    nextReview: null,
    reviewHistory: [],
  };
}