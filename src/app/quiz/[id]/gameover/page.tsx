"use client";

export const dynamic = 'force-dynamic';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { Home, Trophy, Flame, Heart, RefreshCw } from 'lucide-react';

export default function GameOverPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { state, restoreLife } = useStore();
  
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

  const handleTryAgain = () => {
    restoreLife();
    router.push(`/quiz/${deckId}`);
  };

  const handleReturnHome = () => {
    router.push('/');
  };

  return (
    <main className="flex-1 flex flex-col p-6 max-w-md mx-auto w-full items-center justify-center relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-error/20 rounded-full blur-[80px] -z-10" />

      <div className="flex flex-col items-center text-center space-y-6">
        <div className="w-24 h-24 bg-surface-container-high rounded-full flex items-center justify-center mb-4 shadow-[0_0_40px_rgba(255,0,0,0.3)]">
          <Heart className="w-12 h-12 text-error" />
        </div>

        <h1 className="text-4xl font-display font-bold text-on-surface tracking-tight">
          Game Over!
        </h1>

        <p className="text-on-surface-variant font-body text-lg max-w-[250px]">
          You&apos;ve run out of lives! Don&apos;t worry, your streak is safe.
        </p>

        <div className="grid grid-cols-2 gap-4 w-full mt-4">
          <div className="glass-panel py-4 px-4 rounded-2xl flex flex-col items-center border border-outline-variant/30">
            <Flame className="w-6 h-6 text-orange-500 mb-1" />
            <span className="text-xl font-display font-bold text-on-surface">{state.streak}</span>
            <span className="text-xs font-bold tracking-widest uppercase text-on-surface-variant">Day Streak</span>
          </div>
          
          <div className="glass-panel py-4 px-4 rounded-2xl flex flex-col items-center border border-outline-variant/30">
            <Trophy className="w-6 h-6 text-primary mb-1" />
            <span className="text-xl font-display font-bold text-on-surface">{state.totalXp}</span>
            <span className="text-xs font-bold tracking-widest uppercase text-on-surface-variant">XP Earned</span>
          </div>
        </div>

        <div className="text-sm text-on-surface-variant mt-2">
          Get 3 correct in a row to restore a life!
        </div>
      </div>

      <div className="w-full mt-auto pt-12 space-y-4">
        <button
          onClick={handleTryAgain}
          className="w-full py-4 px-8 gradient-primary text-on-primary font-bold text-xl rounded-full hover:opacity-90 transition-all flex justify-center items-center gap-3 shadow-lg glow-hover"
        >
          <RefreshCw className="w-6 h-6" />
          Try Again
        </button>
        
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