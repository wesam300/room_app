'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import Image from 'next/image';

const FRUITS = [
  { name: '🍉', multiplier: 5, emoji: '🍉', image: '/watermelon.png' },
  { name: '🍒', multiplier: 45, emoji: '🍒', image: '/cherry.png' },
  { name: '🍊', multiplier: 25, emoji: '🍊', image: '/orange.png' },
  { name: '🍐', multiplier: 5, emoji: '🍐', image: '/pear.png' },
  { name: '🍋', multiplier: 15, emoji: '🍋', image: '/lemon.png' },
  { name: '🍓', multiplier: 5, emoji: '🍓', image: '/strawberry.png' },
  { name: '🍎', multiplier: 5, emoji: '🍎', image: '/apple.png' },
  { name: '🍇', multiplier: 10, emoji: '🍇', image: '/grapes.png' },
];

const BET_AMOUNTS = [10, 50, 100, 500];
const SPIN_DURATION_S = 20;

const FruitImage = ({ src, alt }: { src: string; alt: string }) => (
  <div className="relative w-16 h-16">
    <Image src={src} alt={alt} width={64} height={64} className="object-contain" data-ai-hint={`${alt.toLowerCase()}`}/>
  </div>
);


export default function FruityFortunePage() {
  const [balance, setBalance] = useState(1000);
  const [selectedFruit, setSelectedFruit] = useState<typeof FRUITS[0] | null>(null);
  const [betAmount, setBetAmount] = useState(BET_AMOUNTS[0]);
  const [result, setResult] = useState<{ fruit: typeof FRUITS[0]; won: boolean } | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(SPIN_DURATION_S);
  const [history, setHistory] = useState<typeof FRUITS[number][]>([]);

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
        // After showing result for a few seconds, reset
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-purple-900 p-4 font-headline text-white">
      <main className="w-full max-w-sm mx-auto text-center space-y-4">
        
        <div className="bg-purple-800/50 p-2 rounded-lg">
          <p className="text-lg">رصيد الكوينزة</p>
          <p className="text-3xl font-bold tracking-wider">{balance.toLocaleString()}</p>
        </div>

        <div className="bg-gradient-to-b from-purple-800 to-purple-900 border-4 border-yellow-500 rounded-3xl p-4 shadow-2xl space-y-4">
          
          <div className="grid grid-cols-3 gap-2">
            {FRUITS.slice(0, 4).map((fruit, index) => (
              index === 2 ? 
              <div key="placeholder-1" /> :
              <FruitButton key={fruit.name} fruit={fruit} isSelected={selectedFruit?.name === fruit.name} onSelect={() => setSelectedFruit(fruit)} disabled={isSpinning || !!result} />
            ))}
            
            <FruitButton fruit={FRUITS[4]} isSelected={selectedFruit?.name === FRUITS[4].name} onSelect={() => setSelectedFruit(FRUITS[4])} disabled={isSpinning || !!result} />
            <TimerDisplay timeLeft={timeLeft} isSpinning={isSpinning} result={result} />
            <FruitButton fruit={FRUITS[5]} isSelected={selectedFruit?.name === FRUITS[5].name} onSelect={() => setSelectedFruit(FRUITS[5])} disabled={isSpinning || !!result} />

            {FRUITS.slice(6).map((fruit) => (
              <FruitButton key={fruit.name} fruit={fruit} isSelected={selectedFruit?.name === fruit.name} onSelect={() => setSelectedFruit(fruit)} disabled={isSpinning || !!result} />
            ))}
             <div key="placeholder-2" />
          </div>

          <div className="grid grid-cols-4 gap-2">
            {BET_AMOUNTS.map(amount => (
              <Button
                key={amount}
                onClick={() => setBetAmount(amount)}
                disabled={isSpinning || !!result}
                className={cn(
                  "bg-yellow-500 text-purple-900 font-bold rounded-full hover:bg-yellow-400 transition-transform hover:scale-105",
                  betAmount === amount && "ring-2 ring-white",
                  (isSpinning || !!result) && "opacity-50 cursor-not-allowed"
                )}
              >
                {amount}
              </Button>
            ))}
          </div>

        </div>

        <Button onClick={startGame} disabled={!canPlay} size="lg" className="w-full bg-yellow-500 hover:bg-yellow-400 text-purple-900 font-bold text-lg shadow-xl h-14 rounded-full transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed">
            {isSpinning ? `...بدء...` : 'راهن'}
        </Button>


        <div className="bg-purple-800/50 p-2 rounded-lg mt-4">
            <h3 className="text-md mb-2">التاريخ</h3>
            <div className="flex justify-center items-center gap-3 h-12">
                {history.length > 0 ? history.map((fruit, i) => (
                    <div key={i} className="relative">
                        <FruitImage src={fruit.image} alt={fruit.name} />
                        {i === 0 && result && (
                            <span className="absolute -top-1 -right-2 bg-yellow-400 text-black text-xs font-bold px-1 rounded-full">New</span>
                        )}
                    </div>
                )) : <p className="text-sm text-white/60">لم يتم لعب أي جولة بعد.</p>}
            </div>
        </div>
      </main>
    </div>
  );
}

const FruitButton = ({ fruit, isSelected, onSelect, disabled }: { fruit: typeof FRUITS[0], isSelected: boolean, onSelect: () => void, disabled: boolean }) => (
  <button
    onClick={onSelect}
    disabled={disabled}
    className={cn(
      "bg-purple-600/50 rounded-lg p-2 flex flex-col items-center justify-center aspect-square transition-all duration-200 transform hover:bg-purple-600/80",
      isSelected && "ring-2 ring-yellow-400 scale-105",
      disabled && "opacity-50 cursor-not-allowed"
    )}
  >
    <FruitImage src={fruit.image} alt={fruit.name} />
    <span className="text-xs font-semibold mt-1">{fruit.multiplier} مرة</span>
  </button>
);


const TimerDisplay = ({ timeLeft, isSpinning, result }: { timeLeft: number, isSpinning: boolean, result: { fruit: typeof FRUITS[0]; won: boolean } | null }) => {
    const displayClasses = "flex items-center justify-center text-5xl font-mono bg-black/50 border-4 border-yellow-600 rounded-lg aspect-square";

    if (result) {
        return (
            <div className={cn(displayClasses, "animate-pulse")}>
                 <FruitImage src={result.fruit.image} alt={result.fruit.name} />
            </div>
        );
    }
    
    return (
        <div className={displayClasses}>
            {isSpinning ? (
                <span className={timeLeft <= 5 ? "text-red-500 animate-ping" : ""}>
                    {timeLeft.toString().padStart(2, '0')}
                </span>
            ) : (
                 <span className="text-yellow-400 text-3xl">بدء</span>
            )}
        </div>
    );
};
