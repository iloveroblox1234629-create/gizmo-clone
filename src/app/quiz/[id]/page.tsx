"use client";

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { Rating } from '@/lib/srs';
import { X, Trophy, CheckCircle2, XCircle, Sparkles, Loader2, Heart, Flame } from 'lucide-react';

export default function QuizPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { state, updateDeckProgress, addXp, loseLife, incrementCorrectStreak, resetCorrectStreak, checkAndUpdateStreak, recordReview } = useStore();
  
  // Use React.use to unwrap params in Next.js 15+
  const resolvedParams = use(params);
  const deckId = resolvedParams.id;
  const deck = state.decks[deckId];
  
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [tutorExplanation, setTutorExplanation] = useState<string | null>(null);
  const [isLoadingTutor, setIsLoadingTutor] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [writtenAnswer, setWrittenAnswer] = useState('');
  const [isGradingWritten, setIsGradingWritten] = useState(false);

  useEffect(() => {
    checkAndUpdateStreak();
  }, [checkAndUpdateStreak]);

  useEffect(() => {
    if (!deck) {
      router.push('/');
    } else if (deck.completed) {
      router.push(`/quiz/${deckId}/summary`);
    }
  }, [deck, deckId, router]);

  useEffect(() => {
    if (state.lives === 0 && deck && !deck.completed) {
      router.push(`/quiz/${deckId}/gameover`);
    }
  }, [state.lives, deck, deckId, router]);

  if (!deck || deck.completed) return null;

  if (!deck?.questions?.length) return null;

  const currentQuestion = deck.questions[deck.currentQuestionIndex];
  const progressPercent = ((deck.currentQuestionIndex ?? 0) / (deck.questions?.length ?? 1)) * 100;

  const handleNext = (wasCorrect: boolean) => {
    updateDeckProgress(deckId, deck.currentQuestionIndex + 1, wasCorrect ? 10 : 0);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setTutorExplanation(null);
    setShowRating(false);
    setWrittenAnswer('');
    setIsGradingWritten(false);
  };

  const handleRate = (rating: Rating) => {
    recordReview(deckId, currentQuestion.id, rating);
    setShowRating(false);
    setTimeout(() => handleNext(true), 300);
  };

  const handleFail = () => {
    recordReview(deckId, currentQuestion.id, 'again');
    loseLife();
    setTimeout(() => handleNext(false), 300);
  };

  const handleSelect = async (index: number) => {
    if (selectedAnswer !== null) return;
    
    setSelectedAnswer(index);
    const correct = index === currentQuestion.correctAnswerIndex;
    setIsCorrect(correct);

    if (correct) {
      addXp(10);
      incrementCorrectStreak();
      setShowRating(true);
    } else {
      loseLife();
      resetCorrectStreak();
    }
  };

  const handleAskTutor = async () => {
    if (selectedAnswer === null) return;
    
    setIsLoadingTutor(true);
    try {
      const response = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentQuestion.text,
          wrongAnswer: currentQuestion.options[selectedAnswer],
          correctAnswer: currentQuestion.options[currentQuestion.correctAnswerIndex],
          openaiKey: state.openAiKey,
          geminiKey: state.geminiKey,
        }),
      });
      const data = await response.json();
      if (data.explanation) {
        setTutorExplanation(data.explanation);
      } else {
        setTutorExplanation("Looks like we had an issue generating an explanation.");
      }
    } catch {
      setTutorExplanation("Failed to load tutor explanation.");
    } finally {
      setIsLoadingTutor(false);
    }
  };

  const handleSubmitWritten = async () => {
    if (!writtenAnswer.trim()) return;
    
    setIsGradingWritten(true);
    try {
      const response = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentQuestion.text,
          correctAnswer: currentQuestion.sampleAnswer || currentQuestion.options[0] || '',
          userAnswer: writtenAnswer,
          questionType: currentQuestion.type,
          openaiKey: state.openAiKey,
          geminiKey: state.geminiKey,
        }),
      });
      const data = await response.json();
      
      const correct = data.correct ?? false;
      setIsCorrect(correct);
      setTutorExplanation(data.explanation || "AI grading complete.");
      
      if (correct) {
        addXp(10);
        incrementCorrectStreak();
        setTimeout(() => handleNext(true), 500);
      } else {
        loseLife();
        resetCorrectStreak();
        setTimeout(() => handleNext(false), 500);
      }
    } catch (error) {
      setTutorExplanation("Failed to grade answer.");
      setIsCorrect(false);
      setTimeout(() => handleNext(false), 500);
    } finally {
      setIsGradingWritten(false);
    }
  };

  const getOptionClassName = (index: number) => {
    const baseClass = "w-full p-4 rounded-xl text-left font-medium transition-all text-lg border ";
    
    if (selectedAnswer === null) {
      return baseClass + "bg-surface-container-low border-outline-variant/30 hover:border-primary/50 text-on-surface";
    }

    if (index === currentQuestion.correctAnswerIndex) {
      return baseClass + "bg-primary/20 border-primary text-primary shadow-[0_0_15px_rgba(255,135,190,0.2)]";
    }

    if (index === selectedAnswer && !isCorrect) {
      return baseClass + "bg-error/20 border-error text-error";
    }

    return baseClass + "bg-surface-container-low/50 border-outline-variant/10 text-on-surface-variant/50";
  };

  return (
    <main className="flex-1 flex flex-col p-6 max-w-md mx-auto w-full">
      <header className="flex justify-between items-center mb-8 pt-4">
        <button 
          onClick={() => router.push('/')}
          className="p-2 -ml-2 text-on-surface-variant hover:text-primary transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        
        <div className="flex-1 px-4">
          <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="text-center text-xs font-bold text-on-surface-variant mt-2 tracking-widest uppercase">
            Question {String(deck?.currentQuestionIndex ?? 0)} of {String(deck?.questions?.length ?? 0)}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 font-bold text-orange-500 bg-orange-500/10 px-2 py-1 rounded-full" title="Streak">
            <Flame className="w-4 h-4" />
            {state.streak}
          </div>
          <div className="flex items-center gap-1 font-bold text-error bg-error/10 px-2 py-1 rounded-full" title="Lives">
            <Heart className="w-4 h-4" />
            {state.lives}
          </div>
          <div className="flex items-center gap-1 font-bold text-primary bg-primary/10 px-2 py-1 rounded-full" title="XP">
            <Trophy className="w-4 h-4" />
            {state.totalXp}
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col justify-center gap-8 mb-12">
        <h2 className="text-2xl font-display font-bold leading-tight text-on-surface">
          {currentQuestion.text}
        </h2>

        {currentQuestion.type === 'written' || currentQuestion.type === 'short' ? (
          <div className="space-y-4">
            <textarea
              value={writtenAnswer}
              onChange={(e) => setWrittenAnswer(e.target.value)}
              placeholder={currentQuestion.type === 'written' ? 'Type your answer...' : 'Short answer...'}
              disabled={selectedAnswer !== null}
              className="w-full p-4 rounded-xl text-left font-medium text-lg border bg-surface-container-low border-outline-variant/30 focus:border-primary/50 text-on-surface resize-none min-h-[120px]"
            />
            <button
              onClick={handleSubmitWritten}
              disabled={selectedAnswer !== null || !writtenAnswer.trim() || isGradingWritten}
              className="w-full py-4 gradient-primary text-on-primary font-bold rounded-xl hover:opacity-90 transition-all flex justify-center items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGradingWritten ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Grading...
                </>
              ) : (
                'Submit Answer'
              )}
            </button>
            {tutorExplanation && selectedAnswer !== null && (
              <div className="mt-4 p-4 glass-panel rounded-xl border border-primary/30">
                <div className="flex items-center gap-2 mb-2 text-primary font-bold">
                  <Sparkles className="w-5 h-5" />
                  AI Feedback
                </div>
                <p className="text-on-surface leading-relaxed text-sm">{tutorExplanation}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {currentQuestion.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleSelect(idx)}
                disabled={selectedAnswer !== null}
                className={getOptionClassName(idx)}
              >
                <div className="flex justify-between items-center">
                  <span>{option}</span>
                  {selectedAnswer !== null && idx === currentQuestion.correctAnswerIndex && (
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  )}
                  {selectedAnswer === idx && !isCorrect && (
                    <XCircle className="w-5 h-5 text-error" />
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {selectedAnswer !== null && isCorrect && showRating && (
          <div className="mt-4 p-6 glass-panel rounded-2xl border border-primary/20 shadow-[0_10px_30px_rgba(255,135,190,0.1)] animate-in fade-in slide-in-from-bottom-4">
            <div className="text-center text-sm font-bold text-on-surface-variant mb-4">
              How well did you know this?
            </div>
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => handleRate('again')}
                className="py-3 bg-error/20 text-error border border-error/30 font-bold rounded-xl hover:bg-error/30 transition-all text-sm"
              >
                Again
              </button>
              <button
                onClick={() => handleRate('hard')}
                className="py-3 bg-orange-500/20 text-orange-500 border border-orange-500/30 font-bold rounded-xl hover:bg-orange-500/30 transition-all text-sm"
              >
                Hard
              </button>
              <button
                onClick={() => handleRate('good')}
                className="py-3 bg-primary/20 text-primary border border-primary/30 font-bold rounded-xl hover:bg-primary/30 transition-all text-sm"
              >
                Good
              </button>
              <button
                onClick={() => handleRate('easy')}
                className="py-3 bg-green-500/20 text-green-500 border border-green-500/30 font-bold rounded-xl hover:bg-green-500/30 transition-all text-sm"
              >
                Easy
              </button>
            </div>
          </div>
        )}

        {selectedAnswer !== null && !isCorrect && (
          <div className="mt-4 p-6 glass-panel rounded-2xl border border-error/20 shadow-[0_10px_30px_rgba(255,135,190,0.1)] animate-in fade-in slide-in-from-bottom-4">
            
            {tutorExplanation || isLoadingTutor ? (
              <div className="bg-surface-container/50 rounded-xl p-4 border border-primary/30 mb-6">
                <div className="flex items-center gap-2 mb-3 text-primary font-bold">
                  <Sparkles className="w-5 h-5" />
                  AI Tutor
                </div>
                {isLoadingTutor ? (
                  <div className="flex items-center gap-2 text-on-surface-variant font-medium">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Thinking...
                  </div>
                ) : (
                  <p className="text-on-surface leading-relaxed text-sm md:text-base">
                    {tutorExplanation}
                  </p>
                )}
              </div>
            ) : (
              <button
                onClick={handleAskTutor}
                className="w-full mb-4 py-3 bg-primary/10 text-primary border border-primary/30 font-bold rounded-xl hover:bg-primary/20 transition-all flex justify-center items-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                Ask AI Tutor for an Explanation
              </button>
            )}
            
<button
                onClick={handleFail}
                className="w-full py-4 gradient-primary text-on-primary font-bold rounded-xl hover:opacity-90 transition-all flex justify-center items-center gap-2 shadow-lg glow-hover"
              >
                Continue
              </button>
          </div>
        )}
      </div>
    </main>
  );
}
