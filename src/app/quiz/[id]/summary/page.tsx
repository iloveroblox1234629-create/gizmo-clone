"use client";

export const dynamic = 'force-dynamic';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { Home, Sparkles, Trophy } from 'lucide-react';

export default function QuizSummaryPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { state, deleteDeck } = useStore();
  
  const resolvedParams = use(params);
  const deckId = resolvedParams.id;
  const deck = state.decks[deckId];

  useEffect(() => {
    if (!deck) {
      router.replace('/');
    }
  }, [deck, router]);

  if (!deck) {
    return null;
  }

  const handleReturnHome = () => {
    // Optionally clean up the deck to save space, or keep it.
    // We'll keep it so they can see progress, but wait, the PRD says "Resume last session".
    // If it's completed, it shouldn't be resumed. We can delete it.
    deleteDeck(deckId);
    router.push('/');
  };

  return (
    <main className="flex-1 flex flex-col p-6 max-w-md mx-auto w-full items-center justify-center relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-primary/20 rounded-full blur-[80px] -z-10" />

      <div className="flex flex-col items-center text-center space-y-6">
        <div className="w-24 h-24 bg-surface-container-high rounded-full flex items-center justify-center mb-4 shadow-[0_0_40px_rgba(255,135,190,0.3)]">
          <Sparkles className="w-12 h-12 text-primary" />
        </div>

        <h1 className="text-4xl font-display font-bold text-on-surface tracking-tight">
          Quiz Complete!
        </h1>

        <p className="text-on-surface-variant font-body text-lg max-w-[250px]">
          You successfully completed all questions in this study session.
        </p>

        <div className="glass-panel mt-8 py-6 px-10 rounded-3xl flex flex-col items-center gap-2 border border-outline-variant/30">
          <span className="text-sm font-bold tracking-widest uppercase text-on-surface-variant">
            XP Earned
          </span>
          <div className="flex items-center gap-3 text-4xl font-display font-bold text-primary">
            <Trophy className="w-8 h-8" />
            +{String(deck?.score ?? 0)}
          </div>
        </div>
      </div>

      <div className="w-full mt-auto pt-12 space-y-4">
        <button
          onClick={handleReturnHome}
          className="w-full py-4 px-8 bg-surface-container-high text-on-surface font-bold text-xl rounded-full hover:bg-surface-container-highest transition-all flex justify-center items-center gap-3 border border-outline-variant/30"
        >
          <Home className="w-6 h-6 text-primary" />
          Return to Home
        </button>
      </div>
    </main>
  );
}
