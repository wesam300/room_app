'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const FRUITS = ['🍉', '🍋', '🍒', '🍎'];
const BET_AMOUNT = 10;
const WIN_MULTIPLIER = 5;
const SPIN_DURATION_S = 30;

export default function FruityFortunePage() {
  const [balance, setBalance] = useState(1000);
  const [selectedFruit, setSelectedFruit] = useState<string | null>(null);
  const [result, setResult] = useState<{ fruit: string; won: boolean } | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinningFruit, setSpinningFruit] = useState(FRUITS[0]);
  const [timeLeft, setTimeLeft] = useState(0);

  const finishGame = useCallback(() => {
    if (!selectedFruit) return;

    const randomFruit = FRUITS[Math.floor(Math.random() * FRUITS.length)];
    const won = randomFruit === selectedFruit;

    setResult({ fruit: randomFruit, won });

    if (won) {
      setBalance(prev => prev + BET_AMOUNT * WIN_MULTIPLIER);
    }

    setIsSpinning(false);
  }, [selectedFruit]);

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (isSpinning) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            finishGame();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isSpinning, finishGame]);

  const startGame = () => {
    if (selectedFruit && balance >= BET_AMOUNT) {
      setBalance(prev => prev - BET_AMOUNT);
      setResult(null);
      setTimeLeft(SPIN_DURATION_S);
      setIsSpinning(true);
    }
  };

  const resetGame = () => {
    setSelectedFruit(null);
    setResult(null);
  };
  
  const canPlay = !isSpinning && selectedFruit !== null && balance >= BET_AMOUNT;

  const gameMessage = useMemo(() => {
    if (result) {
      if (result.won) {
        return `ربحت ${BET_AMOUNT * WIN_MULTIPLIER}!`;
      }
      return 'حظ أوفر في المرة القادمة!';
    }
    if (isSpinning) {
      return `الوقت المتبقي: ${timeLeft} ثانية`;
    }
    if (!selectedFruit) {
        return 'اختر فاكهة';
    }
    return 'جاهز للمراهنة!';
  }, [result, isSpinning, selectedFruit, timeLeft]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-background to-primary p-4 font-headline text-foreground selection:bg-accent selection:text-accent-foreground animate-[background-pan_10s_ease-in-out_infinite]">
      <main className="w-full max-w-sm mx-auto text-center space-y-6">
        <header className="space-y-2">
          <h1 className="text-5xl font-bold drop-shadow-lg">ثروة الفواكه</h1>
          <p className="text-2xl font-semibold bg-black/20 px-4 py-1.5 rounded-lg tabular-nums">
            رصيدك: <span className="font-bold">{balance}</span>
          </p>
        </header>

        <Card className="bg-white/10 backdrop-blur-sm border-2 border-white/20 shadow-lg rounded-2xl">
          <CardContent className="p-6 min-h-[280px] flex flex-col justify-center items-center gap-4">
            {isSpinning ? (
              <>
                <div className="text-8xl animate-spin">{FRUITS[timeLeft % FRUITS.length]}</div>
              </>
            ) : result ? (
              <div className="space-y-2 flex flex-col items-center">
                 <p className="text-sm text-primary-foreground/80">الفاكهة الفائزة هي...</p>
                <div className="text-8xl transition-transform duration-500 ease-out scale-110">{result.fruit}</div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 w-full">
                {FRUITS.map(fruit => (
                  <button
                    key={fruit}
                    onClick={() => !isSpinning && setSelectedFruit(fruit)}
                    aria-label={`Select ${fruit}`}
                    className={cn(
                      'text-6xl p-4 rounded-xl transition-all transform duration-300 ease-out',
                      'bg-white/10 hover:bg-white/20 hover:scale-105 aspect-square flex justify-center items-center',
                      selectedFruit === fruit && 'ring-4 ring-yellow-400 scale-110 bg-white/25',
                      isSpinning && 'cursor-not-allowed'
                    )}
                    disabled={isSpinning}
                  >
                    {fruit}
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-3">
          <p className={cn(
            "text-xl font-semibold h-7 transition-all duration-300 text-white", 
            result?.won && "text-yellow-400 scale-110",
            result?.won === false && "text-white/70"
            )}>
            {gameMessage}
          </p>

          {result ? (
            <Button onClick={resetGame} size="lg" className="w-full bg-white hover:bg-white/90 text-background font-bold text-lg shadow-xl transition-transform hover:scale-105">
              العب مرة أخرى
            </Button>
          ) : (
            <Button onClick={startGame} disabled={!canPlay} size="lg" className="w-full bg-white hover:bg-white/90 text-background font-bold text-lg shadow-xl transition-transform hover:scale-105 disabled:bg-gray-500/50 disabled:shadow-none disabled:scale-100 disabled:cursor-not-allowed">
              {isSpinning ? `...` : `راهن بـ ${BET_AMOUNT}`}
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
