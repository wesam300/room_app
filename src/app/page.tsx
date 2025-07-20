'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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

const FRUIT_GRID_ORDER = [
    FRUITS[0], FRUITS[1], FRUITS[2],
    FRUITS[7], null,      FRUITS[3],
    FRUITS[6], FRUITS[5], FRUITS[4],
];

const SPINNER_ORDER = [0, 1, 2, 5, 8, 7, 6, 3]; // Indexes in FRUIT_GRID_ORDER

const BET_AMOUNTS = [10, 50, 100, 10000];
const ROUND_DURATION_S = 30;
const SPIN_ANIMATION_MS = 100;
const TOTAL_SPIN_DURATION_MS = 3000;


const FruitImage = ({ fruit, size = 64 }: { fruit: Fruit, size?: number }) => (
  <div className="relative" style={{ width: size, height: size }}>
    <span style={{ fontSize: `${size * 0.8}px` }} role="img" aria-label={fruit.name}>{fruit.emoji}</span>
  </div>
);


export default function FruityFortunePage() {
  const [balance, setBalance] = useState(1000);
  const [bets, setBets] = useState<{[key: string]: number}>({});
  const [activeBetAmount, setActiveBetAmount] = useState(BET_AMOUNTS[0]);
  const [result, setResult] = useState<{ fruit: Fruit; winnings: number } | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(ROUND_DURATION_S);
  const [history, setHistory] = useState<Fruit[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const startNewRound = useCallback(() => {
    setIsSpinning(false);
    setResult(null);
    setBets({});
    setTimeLeft(ROUND_DURATION_S);
    setHighlightedIndex(-1);
  }, []);

  const finishRound = useCallback(() => {
    setIsSpinning(true);
    setTimeLeft(0);
    
    const totalBet = Object.values(bets).reduce((acc, val) => acc + val, 0);

    const randomFruit = FRUITS[Math.floor(Math.random() * FRUITS.length)];
    
    // Spinner animation logic
    let spinCycles = 0;
    const totalSpins = Math.floor(TOTAL_SPIN_DURATION_MS / (SPINNER_ORDER.length * SPIN_ANIMATION_MS));
    const finalStopGridIndex = FRUIT_GRID_ORDER.findIndex(f => f?.name === randomFruit.name);

    let currentSpinnerIndex = highlightedIndex === -1 ? 0 : highlightedIndex;

    const spinInterval = setInterval(() => {
        currentSpinnerIndex = (currentSpinnerIndex + 1) % SPINNER_ORDER.length;
        setHighlightedIndex(currentSpinnerIndex);

        if (currentSpinnerIndex === 0) spinCycles++;

        // Check if spinning should stop
        if (spinCycles >= totalSpins && SPINNER_ORDER[currentSpinnerIndex] === finalStopGridIndex) {
            clearInterval(spinInterval);
            setTimeout(() => { // Show final result after animation stops
                const winnings = (bets[randomFruit.name] || 0) * randomFruit.multiplier;
                setResult({ fruit: randomFruit, winnings });
                setHistory(prev => [randomFruit, ...prev].slice(0, 5));
                setBalance(prev => prev + winnings);
                setTimeout(startNewRound, 4000); // Wait 4s before starting new round
            }, 1000);
        }
    }, SPIN_ANIMATION_MS);

  }, [bets, startNewRound, highlightedIndex]);


  useEffect(() => {
    if (timeLeft > 0 && !isSpinning) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !isSpinning) {
      finishRound();
    }
  }, [timeLeft, isSpinning, finishRound]);

  const handleBet = (fruit: Fruit) => {
    if (isSpinning || timeLeft <= 0) return;

    if (balance >= activeBetAmount) {
        setBalance(prev => prev - activeBetAmount);
        setBets(prev => ({
            ...prev,
            [fruit.name]: (prev[fruit.name] || 0) + activeBetAmount
        }));
    } else {
        // Maybe show a toast message for insufficient balance
        console.log("Not enough balance");
    }
  };


  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#3a1a52] p-4 font-headline text-white">
      <main className="w-full max-w-md mx-auto text-center space-y-6">
        
        <div className="bg-black/20 p-4 rounded-xl">
          <p className="text-xl text-yellow-300">رصيد الكوينزة</p>
          <p className="text-4xl font-bold tracking-wider">{balance.toLocaleString()}</p>
        </div>

        <div className="bg-gradient-to-b from-[#4c2a6c] to-[#3a1a52] border-4 border-yellow-500 rounded-3xl p-6 shadow-2xl space-y-6">
          
          <div className="grid grid-cols-3 gap-4 justify-items-center">
            {FRUIT_GRID_ORDER.map((fruit, index) => {
                if (!fruit) {
                    return <TimerDisplay key={index} timeLeft={timeLeft} isSpinning={isSpinning} result={result} />;
                }
                const isHighlighted = isSpinning && SPINNER_ORDER[highlightedIndex] === index;
                return (
                    <FruitButton
                        key={fruit.name}
                        fruit={fruit}
                        betAmount={bets[fruit.name] || 0}
                        onSelect={() => handleBet(fruit)}
                        disabled={isSpinning || timeLeft <= 0}
                        isHighlighted={isHighlighted}
                    />
                );
            })}
          </div>

          <div className="grid grid-cols-4 gap-3">
            {BET_AMOUNTS.map(amount => (
              <Button
                key={amount}
                onClick={() => setActiveBetAmount(amount)}
                disabled={isSpinning || timeLeft <= 0}
                className={cn(
                  "bg-yellow-500 text-purple-900 font-bold rounded-full text-lg h-12 hover:bg-yellow-400 transition-transform hover:scale-105",
                  activeBetAmount === amount && "ring-4 ring-white shadow-lg",
                  (isSpinning || timeLeft <= 0) && "opacity-50 cursor-not-allowed"
                )}
              >
                {amount.toLocaleString()}
              </Button>
            ))}
          </div>

        </div>

        <div className="bg-black/20 p-3 rounded-lg mt-4">
            <h3 className="text-lg mb-2 text-yellow-300">التاريخ</h3>
            <div className="flex justify-center items-center gap-4 h-16">
                {history.length > 0 ? history.map((fruit, i) => (
                    <div key={i} className={cn("relative transition-all", i === 0 && "scale-110")}>
                        <FruitImage fruit={fruit} size={40} />
                         {i === 0 && result && (
                            <span className="absolute -top-1 -right-2 text-xs bg-yellow-400 text-black font-bold px-1.5 py-0.5 rounded-full animate-bounce">
                                NEW
                            </span>
                        )}
                    </div>
                )) : <p className="text-md text-white/60">لم يتم لعب أي جولة بعد.</p>}
            </div>
        </div>
      </main>
    </div>
  );
}

const FruitButton = ({ fruit, betAmount, onSelect, disabled, isHighlighted }: { fruit: Fruit, betAmount: number, onSelect: () => void, disabled: boolean, isHighlighted: boolean }) => (
  <button
    onClick={onSelect}
    disabled={disabled}
    className={cn(
      "bg-black/20 rounded-xl p-2 flex flex-col items-center justify-center w-24 h-24 aspect-square transition-all duration-200 transform hover:bg-black/40 relative overflow-hidden",
      isHighlighted && "ring-4 ring-yellow-400 scale-105 bg-black/50 shadow-2xl shadow-yellow-400/50",
      disabled && "opacity-70 cursor-not-allowed"
    )}
  >
    <FruitImage fruit={fruit} size={48} />
    <span className="text-sm font-semibold mt-1 text-yellow-300">{fruit.multiplier}x</span>
    {betAmount > 0 && (
        <div className="absolute top-0 right-0 bg-yellow-500 text-purple-900 text-sm font-bold px-2 py-1 rounded-bl-lg rounded-tr-md">
            {betAmount.toLocaleString()}
        </div>
    )}
  </button>
);


const TimerDisplay = ({ timeLeft, isSpinning, result }: { timeLeft: number, isSpinning: boolean, result: { fruit: Fruit; winnings: number } | null }) => {
    const displayClasses = "flex items-center justify-center w-24 h-24 text-6xl font-mono bg-black/30 border-4 border-yellow-600 rounded-xl aspect-square";

    if (result) {
        return (
            <div className={cn(displayClasses, "animate-pulse")}>
                 <div className="flex flex-col items-center text-center">
                    <FruitImage fruit={result.fruit} size={64} />
                    {result.winnings > 0 ? 
                        <span className="text-base text-yellow-300 font-bold animate-pulse mt-1">
                            ربحت {result.winnings.toLocaleString()}!
                        </span>
                        :
                        <span className="text-base text-white/70 font-bold mt-1">
                            حظ أوفر
                        </span>
                    }
                 </div>
            </div>
        );
    }
    
    return (
        <div className={displayClasses}>
             <span className={cn("transition-colors", timeLeft <= 5 && timeLeft > 0 ? "text-red-500 animate-ping" : "text-white")}>
                {isSpinning ? '...' : timeLeft.toString().padStart(2, '0')}
            </span>
        </div>
    );
};
