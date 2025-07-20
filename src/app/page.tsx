'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const FRUITS = ['🍉', '🍋', '🍒', '🍎'];
const BET_AMOUNT = 10;
const WIN_MULTIPLIER = 5;
const SPIN_DURATION_S = 3;

export default function FruityFortunePage() {
  const [balance, setBalance] = useState(1000);
  const [selectedFruit, setSelectedFruit] = useState<string | null>(null);
  const [result, setResult] = useState<{ fruit: string; won: boolean } | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinningFruit, setSpinningFruit] = useState(FRUITS[0]);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!isSpinning) return;

    const spinInterval = setInterval(() => {
      setSpinningFruit(FRUITS[Math.floor(Math.random() * FRUITS.length)]);
    }, 100);

    const countdownInterval = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    const gameEndTimeout = setTimeout(() => {
      clearInterval(spinInterval);
      clearInterval(countdownInterval);
      handleGameEnd();
    }, SPIN_DURATION_S * 1000);

    return () => {
      clearInterval(spinInterval);
      clearInterval(countdownInterval);
      clearTimeout(gameEndTimeout);
    };
  }, [isSpinning]);

  const handleGameEnd = useCallback(() => {
    if (!selectedFruit) return;

    const randomFruit = FRUITS[Math.floor(Math.random() * FRUITS.length)];
    const won = randomFruit === selectedFruit;

    setResult({ fruit: randomFruit, won });

    if (won) {
      setBalance(prev => prev + BET_AMOUNT * WIN_MULTIPLIER);
    }

    setIsSpinning(false);
  }, [selectedFruit]);

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
        return `You Won ${BET_AMOUNT * WIN_MULTIPLIER}!`;
      }
      return 'Better luck next time!';
    }
    if (isSpinning) {
      return 'Spinning...';
    }
    if (!selectedFruit) {
        return 'Select a Fruit';
    }
    return 'Ready to bet!';
  }, [result, isSpinning, selectedFruit]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-background to-primary p-4 font-headline text-primary-foreground selection:bg-accent selection:text-accent-foreground">
      <main className="w-full max-w-sm mx-auto text-center space-y-6">
        <header className="space-y-2">
          <h1 className="text-5xl font-bold drop-shadow-lg">Fruity Fortune</h1>
          <p className="text-2xl font-semibold bg-black/20 px-4 py-1.5 rounded-lg tabular-nums">
            Balance: <span className="font-bold">{balance}</span>
          </p>
        </header>

        <Card className="bg-card/20 backdrop-blur-sm border-2 border-white/20 shadow-lg rounded-2xl">
          <CardContent className="p-6 min-h-[280px] flex flex-col justify-center items-center gap-4">
            {isSpinning ? (
              <>
                <div className="text-8xl animate-bounce">{spinningFruit}</div>
                <p className="text-xl font-semibold animate-pulse tabular-nums">{timeLeft}s remaining</p>
              </>
            ) : result ? (
              <div className="space-y-2 flex flex-col items-center">
                 <p className="text-sm text-primary-foreground/80">The winning fruit is...</p>
                <div className="text-8xl transition-transform duration-500 ease-out scale-110">{result.fruit}</div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 w-full">
                {FRUITS.map(fruit => (
                  <button
                    key={fruit}
                    onClick={() => setSelectedFruit(fruit)}
                    aria-label={`Select ${fruit}`}
                    className={cn(
                      'text-6xl p-4 rounded-xl transition-all transform duration-300 ease-out',
                      'bg-white/10 hover:bg-white/20 hover:scale-105 aspect-square flex justify-center items-center',
                      selectedFruit === fruit && 'ring-4 ring-accent scale-110 bg-white/25'
                    )}
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
            "text-xl font-semibold h-7 transition-all duration-300", 
            result?.won && "text-accent scale-110",
            result?.won === false && "text-destructive-foreground/70"
            )}>
            {gameMessage}
          </p>

          {result ? (
            <Button onClick={resetGame} size="lg" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-lg shadow-xl transition-transform hover:scale-105">
              Play Again
            </Button>
          ) : (
            <Button onClick={startGame} disabled={!canPlay} size="lg" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-lg shadow-xl transition-transform hover:scale-105 disabled:bg-gray-500/50 disabled:shadow-none disabled:scale-100 disabled:cursor-not-allowed">
              {isSpinning ? `Spinning...` : `Bet ${BET_AMOUNT}`}
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
