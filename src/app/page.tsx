'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Image from 'next/image';

type Fruit = {
  name: string;
  multiplier: number;
  emoji: string;
};

const FRUITS: Fruit[] = [
  { name: 'watermelon', multiplier: 5, emoji: '🍉' },
  { name: 'cherry', multiplier: 45, emoji: '🍒' },
  { name: 'orange', multiplier: 25, emoji: '🍊' },
  { name: 'pear', multiplier: 5, emoji: '🍐' },
  { name: 'lemon', multiplier: 15, emoji: '🍋' },
  { name: 'strawberry', multiplier: 5, emoji: '🍓' },
  { name: 'apple', multiplier: 5, emoji: '🍎' },
  { name: 'grapes', multiplier: 10, emoji: '🍇' },
];

const BET_AMOUNTS = [10, 50, 100, 500];
const SPIN_DURATION_S = 20;

const FruitImage = ({ fruit, size = 64 }: { fruit: Fruit, size?: number }) => (
  <div className="relative" style={{ width: size, height: size }}>
    <span style={{ fontSize: `${size * 0.8}px` }} role="img" aria-label={fruit.name}>{fruit.emoji}</span>
  </div>
);


export default function FruityFortunePage() {
  const [balance, setBalance] = useState(1000);
  const [selectedFruit, setSelectedFruit] = useState<Fruit | null>(null);
  const [betAmount, setBetAmount] = useState(BET_AMOUNTS[0]);
  const [result, setResult] = useState<{ fruit: Fruit; won: boolean } | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(SPIN_DURATION_S);
  const [history, setHistory] = useState<Fruit[]>([]);

  const finishGame = useCallback(() => {
    if (!selectedFruit) return;

    const randomFruit = FRUITS[Math.floor(Math.random() * FRUITS.length)];
    const won = randomFruit.name === selectedFruit.name;
    
    setResult({ fruit: randomFruit, won });
    setHistory(prev => [randomFruit, ...prev].slice(0, 5));

    if (won) {
      setBalance(prev => prev + betAmount * selectedFruit.multiplier);
    }

    setIsSpinning(false);
  }, [selectedFruit, betAmount]);

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
    } else if (result) {
        const resetTimer = setTimeout(() => {
            resetGame();
        }, 4000);
        return () => clearTimeout(resetTimer);
    }
    return () => clearInterval(timer);
  }, [isSpinning, finishGame, result]);

  const startGame = () => {
    if (selectedFruit && balance >= betAmount) {
      setBalance(prev => prev - betAmount);
      setResult(null);
      setTimeLeft(SPIN_DURATION_S);
      setIsSpinning(true);
    }
  };

  const resetGame = () => {
    setSelectedFruit(null);
    setResult(null);
  };
  
  const canPlay = !isSpinning && selectedFruit !== null && balance >= betAmount && !result;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#3a1a52] p-4 font-headline text-white">
      <main className="w-full max-w-sm mx-auto text-center space-y-4">
        
        <div className="bg-black/20 p-2 rounded-lg">
          <p className="text-lg text-yellow-300">رصيد الكوينزة</p>
          <p className="text-3xl font-bold tracking-wider">{balance.toLocaleString()}</p>
        </div>

        <div className="bg-gradient-to-b from-[#4c2a6c] to-[#3a1a52] border-4 border-yellow-500 rounded-3xl p-4 shadow-2xl space-y-4">
          
          <div className="grid grid-cols-3 gap-2 justify-items-center">
            <FruitButton fruit={FRUITS[0]} isSelected={selectedFruit?.name === FRUITS[0].name} onSelect={() => setSelectedFruit(FRUITS[0])} disabled={isSpinning || !!result} />
            <FruitButton fruit={FRUITS[1]} isSelected={selectedFruit?.name === FRUITS[1].name} onSelect={() => setSelectedFruit(FRUITS[1])} disabled={isSpinning || !!result} />
            <FruitButton fruit={FRUITS[2]} isSelected={selectedFruit?.name === FRUITS[2].name} onSelect={() => setSelectedFruit(FRUITS[2])} disabled={isSpinning || !!result} />

            <FruitButton fruit={FRUITS[7]} isSelected={selectedFruit?.name === FRUITS[7].name} onSelect={() => setSelectedFruit(FRUITS[7])} disabled={isSpinning || !!result} />
            <TimerDisplay timeLeft={timeLeft} isSpinning={isSpinning} result={result} />
            <FruitButton fruit={FRUITS[3]} isSelected={selectedFruit?.name === FRUITS[3].name} onSelect={() => setSelectedFruit(FRUITS[3])} disabled={isSpinning || !!result} />

            <FruitButton fruit={FRUITS[6]} isSelected={selectedFruit?.name === FRUITS[6].name} onSelect={() => setSelectedFruit(FRUITS[6])} disabled={isSpinning || !!result} />
            <FruitButton fruit={FRUITS[5]} isSelected={selectedFruit?.name === FRUITS[5].name} onSelect={() => setSelectedFruit(FRUITS[5])} disabled={isSpinning || !!result} />
            <FruitButton fruit={FRUITS[4]} isSelected={selectedFruit?.name === FRUITS[4].name} onSelect={() => setSelectedFruit(FRUITS[4])} disabled={isSpinning || !!result} />
          </div>

          <div className="grid grid-cols-4 gap-2">
            {BET_AMOUNTS.map(amount => (
              <Button
                key={amount}
                onClick={() => setBetAmount(amount)}
                disabled={isSpinning || !!result}
                className={cn(
                  "bg-yellow-500 text-purple-900 font-bold rounded-full hover:bg-yellow-400 transition-transform hover:scale-105",
                  betAmount === amount && "ring-2 ring-white shadow-lg",
                  (isSpinning || !!result) && "opacity-50 cursor-not-allowed"
                )}
              >
                {amount}
              </Button>
            ))}
          </div>

        </div>

        <Button onClick={startGame} disabled={!canPlay} size="lg" className="w-full bg-yellow-500 hover:bg-yellow-400 text-purple-900 font-bold text-xl shadow-xl h-14 rounded-full transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed">
            {isSpinning ? `...بدء...` : 'راهن'}
        </Button>


        <div className="bg-black/20 p-2 rounded-lg mt-4">
            <h3 className="text-md mb-2 text-yellow-300">التاريخ</h3>
            <div className="flex justify-center items-center gap-3 h-12">
                {history.length > 0 ? history.map((fruit, i) => (
                    <div key={i} className={cn("relative transition-all", i === 0 && "scale-110")}>
                        <FruitImage fruit={fruit} size={32} />
                         {i === 0 && result && (
                            <span className="absolute -top-1 -right-2 text-[10px] bg-yellow-400 text-black font-bold px-1.5 py-0.5 rounded-full animate-bounce">
                                NEW
                            </span>
                        )}
                    </div>
                )) : <p className="text-sm text-white/60">لم يتم لعب أي جولة بعد.</p>}
            </div>
        </div>
      </main>
    </div>
  );
}

const FruitButton = ({ fruit, isSelected, onSelect, disabled }: { fruit: Fruit, isSelected: boolean, onSelect: () => void, disabled: boolean }) => (
  <button
    onClick={onSelect}
    disabled={disabled}
    className={cn(
      "bg-black/20 rounded-lg p-2 flex flex-col items-center justify-center aspect-square transition-all duration-200 transform hover:bg-black/40",
      isSelected && "ring-2 ring-yellow-400 scale-105 bg-black/50",
      disabled && "opacity-50 cursor-not-allowed"
    )}
  >
    <FruitImage fruit={fruit} size={40} />
    <span className="text-xs font-semibold mt-1 text-yellow-300">{fruit.multiplier}x</span>
  </button>
);


const TimerDisplay = ({ timeLeft, isSpinning, result }: { timeLeft: number, isSpinning: boolean, result: { fruit: Fruit; won: boolean } | null }) => {
    const displayClasses = "flex items-center justify-center text-5xl font-mono bg-black/30 border-4 border-yellow-600 rounded-lg aspect-square";

    if (result) {
        return (
            <div className={cn(displayClasses, "animate-pulse")}>
                 <div className="flex flex-col items-center">
                    <FruitImage fruit={result.fruit} size={56} />
                    {result.won && <span className="text-sm text-yellow-300 font-bold animate-pulse">WIN!</span>}
                 </div>
            </div>
        );
    }
    
    return (
        <div className={displayClasses}>
            {isSpinning ? (
                <span className={cn("transition-colors", timeLeft <= 5 ? "text-red-500 animate-ping" : "text-white")}>
                    {timeLeft.toString().padStart(2, '0')}
                </span>
            ) : (
                 <span className="text-yellow-400 text-3xl font-bold">بدء</span>
            )}
        </div>
    );
};
