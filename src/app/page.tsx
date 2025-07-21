
"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FruitDisplay, FRUITS, FruitKey } from '@/components/fruits';
import { useToast } from "@/hooks/use-toast";

const BET_AMOUNTS = [10000, 50000, 100000, 500000, 1000000];

const GRID_LAYOUT: (FruitKey | 'timer')[] = [
  'orange', 'cherry', 'watermelon',
  'lemon', 'timer', 'pear',
  'grapes', 'apple', 'strawberry'
];


// To create the spinning effect
const SPIN_SEQUENCE: FruitKey[] = [
    'orange', 'lemon', 'grapes', 'apple', 'strawberry', 'pear', 'watermelon', 'cherry'
];

export default function FruityFortunePage() {
  const [balance, setBalance] = useState(10000000);
  const [selectedBetAmount, setSelectedBetAmount] = useState(BET_AMOUNTS[0]);
  const [bets, setBets] = useState<Record<string, number>>({});
  const [timer, setTimer] = useState(20);
  const [isBettingPhase, setIsBettingPhase] = useState(true);
  const [isSpinning, setIsSpinning] = useState(false);
  const [highlightedFruit, setHighlightedFruit] = useState<FruitKey | null>(null);
  const [winningFruit, setWinningFruit] = useState<FruitKey | null>(null);
  const [history, setHistory] = useState<FruitKey[]>([]);
  const [lastWinnings, setLastWinnings] = useState(0);
  const { toast } = useToast();

  // Timer for the betting phase
  useEffect(() => {
    if (!isBettingPhase || isSpinning) return;

    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setIsBettingPhase(false);
      startSpinning();
    }
  }, [isBettingPhase, isSpinning, timer]);

  const startSpinning = () => {
    const totalBet = Object.values(bets).reduce((sum, amount) => sum + amount, 0);
    if (totalBet === 0) {
      resetRound();
      return;
    }
    if (totalBet > balance) {
       toast({
         title: "رصيد غير كاف",
         description: "إجمالي رهانك يتجاوز رصيدك الحالي.",
         variant: "destructive",
       });
       resetRound();
       return;
    }
    
    setBalance(prev => prev - totalBet);
    setIsSpinning(true);
    setWinningFruit(null);
    setLastWinnings(0);

    const fruitKeys = Object.keys(FRUITS) as FruitKey[];
    const winner = fruitKeys[Math.floor(Math.random() * fruitKeys.length)];
    
    // Simulate spinning animation
    const totalSpins = SPIN_SEQUENCE.length * 2; // Spin twice through the sequence
    const finalWinnerIndex = SPIN_SEQUENCE.indexOf(winner);
    const animationDuration = 100; // ms per step
    let spinCount = 0;

    const spinInterval = setInterval(() => {
        setHighlightedFruit(SPIN_SEQUENCE[spinCount % SPIN_SEQUENCE.length]);
        spinCount++;

        if(spinCount > totalSpins + finalWinnerIndex) {
            clearInterval(spinInterval);
            endRound(winner);
        }
    }, animationDuration);
  };

  const endRound = (winner: FruitKey) => {
    setWinningFruit(winner);
    setHighlightedFruit(winner); // Ensure winner is highlighted

    let winnings = 0;
    if (bets[winner]) {
      winnings = bets[winner] * FRUITS[winner].multiplier;
      setBalance(prev => prev + winnings);
    }
    setLastWinnings(winnings);
    setHistory(prev => [winner, ...prev.slice(0, 9)]);

    // Wait for 5 seconds to show the result, then reset for the next round
    setTimeout(() => {
      resetRound();
    }, 5000);
  };
  
  const resetRound = () => {
      setIsBettingPhase(true);
      setIsSpinning(false);
      setWinningFruit(null);
      setHighlightedFruit(null);
      setBets({});
      setTimer(20);
      setLastWinnings(0);
  }

  const placeBet = (fruitId: FruitKey) => {
    // Only allow betting during the betting phase
    if (!isBettingPhase || isSpinning) return;
    setBets(prev => {
      const newBets = { ...prev };
      newBets[fruitId] = (newBets[fruitId] || 0) + selectedBetAmount;
      return newBets;
    });
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${Math.floor(num / 1000)}K`;
    return num.toString();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[#1a013b] via-[#3d026f] to-[#1a013b] text-white p-4 font-sans overflow-hidden" dir="rtl">
      
      <header className="w-full max-w-sm flex justify-between items-center mb-4">
        <div className="flex items-center gap-2 bg-black/40 px-4 py-1 rounded-full border-2 border-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.6)]">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-400 filter drop-shadow-[0_0_2px_#facc15]">
                <path d="M2 4h20M2 8h20M4 12h16M6 16h12M8 20h8M12 4V2M10 4V2M14 4V2M12 20v2M10 20v2M14 20v2M4 8V6M4 12V10M4 16V14M4 20V18M20 8V6M20 12V10M20 16V14M20 20V18M2 12l2-2M2 12l2 2M22 12l-2-2M22 12l-2 2"/>
                <path d="m12 4 2 2-2 2-2-2Z"/>
                <path d="m12 20 2-2-2-2-2 2Z"/>
            </svg>
            <span className="text-yellow-300 font-bold text-sm">كـروب وائـ🎻ـل</span>
        </div>
        <div className="bg-black/30 px-6 py-2 rounded-full border border-yellow-400/50">
          <span className="text-yellow-300 font-bold">الرصيد: {formatNumber(balance)}</span>
        </div>
      </header>

      <main className="w-full max-w-sm bg-black/20 p-3 rounded-3xl border-2 border-yellow-400/80 shadow-[0_0_20px_rgba(255,215,0,0.5)]">
        <div className="grid grid-cols-3 gap-3">
          {GRID_LAYOUT.map((item, index) => {
            if (item === 'timer') {
              return (
                <div key="timer" className="relative flex items-center justify-center bg-gradient-to-br from-purple-800 to-indigo-900 rounded-2xl border-2 border-yellow-400 shadow-[inset_0_0_15px_rgba(255,215,0,0.5)] aspect-square">
                  <AnimatePresence>
                    {lastWinnings > 0 && (
                       <motion.div
                         initial={{ opacity: 0, y: -50, scale: 0.5 }}
                         animate={{ opacity: 1, y: 0, scale: 1 }}
                         exit={{ opacity: 0, y: 50 }}
                         className="absolute text-2xl font-bold text-green-400 z-10"
                       >
                         +{formatNumber(lastWinnings)}
                       </motion.div>
                    )}
                  </AnimatePresence>
                   <div className="flex flex-col items-center justify-center">
                      <div className="text-5xl font-bold text-white z-0">{timer}</div>
                      <div className="text-sm text-yellow-300 mt-1">
                        {isBettingPhase ? 'وقت الرهان' : 'حظاً موفقاً'}
                      </div>
                  </div>
                </div>
              );
            }
            const fruitKey = item as FruitKey;
            const fruit = FRUITS[fruitKey];
            const isWinning = winningFruit === fruitKey;
            const isHighlighted = highlightedFruit === fruitKey;
            
            return (
              <div
                key={`${fruit.id}-${index}`}
                onClick={() => placeBet(fruitKey)}
                className={`relative flex flex-col items-center justify-center p-2 rounded-2xl cursor-pointer transition-all duration-100 aspect-square
                  ${isWinning ? 'bg-yellow-400 scale-110 shadow-[0_0_25px_#facc15]' : isHighlighted ? 'bg-purple-600 scale-105 shadow-[0_0_15px_#a855f7]' : 'bg-black/30'}
                  ${!isBettingPhase ? 'cursor-not-allowed opacity-70' : 'hover:bg-purple-700/80'}`}
              >
                <AnimatePresence>
                {bets[fruit.id] && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute top-1 right-1 bg-yellow-400 text-black text-xs font-bold px-2 py-0.5 rounded-full"
                  >
                    {formatNumber(bets[fruit.id])}
                  </motion.div>
                )}
                </AnimatePresence>
                <FruitDisplay fruitType={fruitKey} size="medium" />
              </div>
            );
          })}
        </div>
      </main>

      <footer className="w-full max-w-sm mt-4 flex flex-col items-center">
        <div className="flex justify-center gap-1 mb-2 w-full">
          {BET_AMOUNTS.map(amount => (
            <button
              key={amount}
              onClick={() => isBettingPhase && setSelectedBetAmount(amount)}
              className={`px-3 py-1 text-xs md:text-sm font-bold rounded-full transition-all duration-300 border-2
                ${selectedBetAmount === amount ? 'bg-yellow-400 text-black border-yellow-200 scale-110 shadow-[0_0_15px_#facc15]' : 'bg-black/30 text-white border-yellow-400/50 hover:bg-black/50'}
                ${!isBettingPhase ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {formatNumber(amount)}
            </button>
          ))}
        </div>
        
        <div className="bg-black/30 w-full p-2 rounded-full flex items-center justify-between mt-1">
          <span className="text-sm font-bold text-yellow-300 ml-2">التاريخ:</span>
          <div className="flex gap-2 overflow-hidden flex-row-reverse">
            {history.slice(0, 10).map((fruitKey, index) => (
              <div key={index} className="bg-purple-900/50 p-1 rounded-full w-8 h-8 flex items-center justify-center">
                 <FruitDisplay fruitType={fruitKey} size="small" />
              </div>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
