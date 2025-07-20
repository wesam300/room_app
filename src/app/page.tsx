
'use client';

import { useState, useEffect, useCallback } from 'react';
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
    FRUITS[3], null,      FRUITS[4],
    FRUITS[5], FRUITS[6], FRUITS[7],
];

const SPINNER_ORDER = [0, 1, 2, 5, 8, 7, 6, 3]; // Indexes in FRUIT_GRID_ORDER

const BET_AMOUNTS = [
    { value: 10000, label: '10K' },
    { value: 50000, label: '50K' },
    { value: 100000, label: '100K' },
    { value: 500000, label: '500K' },
    { value: 1000000, label: '1M' },
];
const ROUND_DURATION_S = 30;
const PRE_SPIN_DELAY_S = 5;
const SPIN_ANIMATION_MS = 100;
const TOTAL_SPIN_DURATION_MS = 3000;

type GameState = 'betting' | 'waiting' | 'spinning' | 'result';

const FruitImage = ({ fruit, size = 64 }: { fruit: Fruit, size?: number }) => (
  <div className="relative" style={{ width: size, height: size }}>
    <span style={{ fontSize: `${size * 0.8}px` }} role="img" aria-label={fruit.name}>{fruit.emoji}</span>
  </div>
);

export default function FruityFortunePage() {
  const [balance, setBalance] = useState(100000000);
  const [bets, setBets] = useState<{[key: string]: number}>({});
  const [activeBetAmount, setActiveBetAmount] = useState(BET_AMOUNTS[0].value);
  const [result, setResult] = useState<{ fruit: Fruit; winnings: number } | null>(null);
  const [gameState, setGameState] = useState<GameState>('betting');
  const [timeLeft, setTimeLeft] = useState(ROUND_DURATION_S);
  const [history, setHistory] = useState<Fruit[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const startNewRound = useCallback(() => {
    setGameState('betting');
    setResult(null);
    setBets({});
    setTimeLeft(ROUND_DURATION_S);
    setHighlightedIndex(-1);
  }, []);

  const runSpinner = useCallback(() => {
      setGameState('spinning');
      
      // Ensure Math.random is only called on the client side after hydration
      if (typeof window === 'undefined') return;

      const randomFruit = FRUITS[Math.floor(Math.random() * FRUITS.length)];
      
      let spinCycles = 0;
      const totalSpins = Math.floor(TOTAL_SPIN_DURATION_MS / (SPINNER_ORDER.length * SPIN_ANIMATION_MS));
      const finalStopGridIndex = FRUIT_GRID_ORDER.findIndex(f => f?.name === randomFruit.name);

      let currentSpinnerIndex = highlightedIndex === -1 ? 0 : SPINNER_ORDER.findIndex(gridIndex => gridIndex === highlightedIndex);
      if(currentSpinnerIndex === -1) currentSpinnerIndex = 0;

      const spinInterval = setInterval(() => {
          currentSpinnerIndex = (currentSpinnerIndex + 1) % SPINNER_ORDER.length;
          setHighlightedIndex(SPINNER_ORDER[currentSpinnerIndex]);

          if (currentSpinnerIndex === 0) spinCycles++;

          if (spinCycles >= totalSpins && SPINNER_ORDER[currentSpinnerIndex] === finalStopGridIndex) {
              clearInterval(spinInterval);
              setTimeout(() => { 
                  const winnings = (bets[randomFruit.name] || 0) * randomFruit.multiplier;
                  setResult({ fruit: randomFruit, winnings });
                  setHistory(prev => [randomFruit, ...prev].slice(0, 5));
                  setBalance(prev => prev + winnings);
                  setGameState('result');
                  setTimeout(startNewRound, 4000); 
              }, 1000);
          }
      }, SPIN_ANIMATION_MS);

  }, [bets, startNewRound, highlightedIndex]);

  useEffect(() => {
    if (gameState === 'betting' && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (gameState === 'betting' && timeLeft === 0) {
        setGameState('waiting');
        setTimeLeft(PRE_SPIN_DELAY_S);
    } else if (gameState === 'waiting' && timeLeft > 0) {
        const timer = setTimeout(() => {
            setTimeLeft(timeLeft - 1);
        }, 1000);
        return () => clearTimeout(timer);
    } else if (gameState === 'waiting' && timeLeft === 0) {
        runSpinner();
    }
  }, [timeLeft, gameState, runSpinner]);

  const handleBet = (fruit: Fruit) => {
    if (gameState !== 'betting') return;

    if (balance >= activeBetAmount) {
        setBalance(prev => prev - activeBetAmount);
        setBets(prev => ({
            ...prev,
            [fruit.name]: (prev[fruit.name] || 0) + activeBetAmount
        }));
    } else {
        console.log("Not enough balance");
    }
  };
  
  const isActionDisabled = gameState !== 'betting';

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-[#3a1a52] to-[#2c1440] p-4 font-headline text-white">
      <div className="relative w-full max-w-md mx-auto bg-gradient-to-b from-[#4c2a6c] to-[#3a1a52] border-4 border-yellow-500/80 rounded-3xl p-4 shadow-2xl shadow-black/50">
        
        <div className="absolute top-2 left-4 bg-black/40 px-3 py-1 rounded-lg text-center shadow-md">
            <p className="text-xs text-yellow-300">رصيد الكوينزة</p>
            <p className="text-base font-bold tracking-tight">{balance.toLocaleString()}</p>
        </div>

        <main className="w-full text-center space-y-4 pt-12">
          
          <div className="grid grid-cols-3 gap-2 sm:gap-4 justify-items-center">
            {FRUIT_GRID_ORDER.map((fruit, index) => {
                if (!fruit) {
                    return <TimerDisplay key={index} timeLeft={timeLeft} gameState={gameState} result={result} />;
                }
                const isHighlighted = gameState === 'spinning' && highlightedIndex === index;
                return (
                    <FruitButton
                        key={fruit.name}
                        fruit={fruit}
                        betAmount={bets[fruit.name] || 0}
                        onSelect={() => handleBet(fruit)}
                        disabled={isActionDisabled}
                        isHighlighted={isHighlighted}
                    />
                );
            })}
          </div>

          <div className="grid grid-cols-5 gap-2 sm:gap-3 px-2">
            {BET_AMOUNTS.map(({value, label}) => (
              <Button
                key={value}
                onClick={() => setActiveBetAmount(value)}
                disabled={isActionDisabled}
                className={cn(
                  "bg-gradient-to-b from-yellow-400 to-yellow-600 text-purple-900 font-bold rounded-full text-md sm:text-lg h-12 hover:from-yellow-300 hover:to-yellow-500 transition-all transform hover:scale-105 shadow-md border-2 border-white/50",
                  activeBetAmount === value && "ring-4 ring-white shadow-lg",
                  isActionDisabled && "opacity-50 cursor-not-allowed"
                )}
              >
                {label}
              </Button>
            ))}
          </div>
        </main>
      </div>
      
      <div className="w-full max-w-md mx-auto bg-black/20 p-3 rounded-lg mt-4">
          <div className="flex justify-center items-center gap-4 h-16">
              <h3 className="text-lg text-yellow-300">التاريخ:</h3>
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
    </div>
  );
}

const FruitButton = ({ fruit, betAmount, onSelect, disabled, isHighlighted }: { fruit: Fruit, betAmount: number, onSelect: () => void, disabled: boolean, isHighlighted: boolean }) => (
  <button
    onClick={onSelect}
    disabled={disabled}
    className={cn(
      "bg-black/30 rounded-xl p-2 flex flex-col items-center justify-center w-24 h-28 sm:w-28 sm:h-32 aspect-square transition-all duration-100 transform hover:bg-black/40 relative overflow-hidden border-2 border-purple-400/50",
      isHighlighted && "ring-4 ring-yellow-400 scale-105 bg-yellow-500/20 shadow-2xl shadow-yellow-400/50 border-yellow-400",
      disabled && "opacity-70 cursor-not-allowed"
    )}
  >
    <FruitImage fruit={fruit} size={56} />
    <span className="text-sm font-semibold mt-1 text-white">{fruit.multiplier} مرة</span>
    {betAmount > 0 && (
        <div className="absolute top-0 right-0 bg-yellow-500 text-purple-900 text-xs font-bold px-2 py-0.5 rounded-bl-lg rounded-tr-md">
            {betAmount.toLocaleString()}
        </div>
    )}
  </button>
);


const TimerDisplay = ({ timeLeft, gameState, result }: { timeLeft: number, gameState: GameState, result: { fruit: Fruit; winnings: number } | null }) => {
    const displayClasses = "flex items-center justify-center w-24 h-28 sm:w-28 sm:h-32 text-6xl font-mono bg-black/40 border-4 border-yellow-500 rounded-xl aspect-square p-2 shadow-inner shadow-black/50";

    if (gameState === 'result' && result) {
        return (
            <div className={cn(displayClasses, "animate-pulse border-yellow-400 bg-yellow-500/10")}>
                 <div className="flex flex-col items-center text-center">
                    <FruitImage fruit={result.fruit} size={64} />
                    {result.winnings > 0 ? 
                        <span className="text-sm text-yellow-300 font-bold animate-pulse mt-1">
                            ربحت {result.winnings.toLocaleString()}!
                        </span>
                        :
                        <span className="text-sm text-white/70 font-bold mt-1">
                            حظ أوفر
                        </span>
                    }
                 </div>
            </div>
        );
    }
    
    let displayText = timeLeft.toString().padStart(2, '0');
    if (gameState === 'spinning') {
        displayText = '...';
    } else if (gameState === 'waiting') {
        displayText = timeLeft.toString();
    }

    return (
        <div className={cn(displayClasses, "border-yellow-500/80")}>
             <span className={cn("transition-colors", 
                gameState === 'betting' && timeLeft <= 5 && timeLeft > 0 ? "animate-ping text-red-500" : "text-white",
                gameState === 'waiting' && "text-yellow-400 animate-pulse",
                gameState === 'spinning' && "text-white"
            )}>
                {displayText}
            </span>
        </div>
    );
};
