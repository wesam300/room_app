
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FruitDisplay, FRUITS, FruitKey } from '@/components/fruits';
import { useToast } from "@/hooks/use-toast";

const BET_AMOUNTS = [10000, 50000, 100000, 500000, 1000000];
const ROUND_DURATION_S = 25;
const BETTING_DURATION_S = 20;

const INITIAL_BALANCE = 100000000;
const BALANCE_STORAGE_KEY = 'fruityFortuneBalance_v15_final_rebuild';

const GRID_LAYOUT: (FruitKey | 'timer')[] = [
    'orange', 'lemon', 'grapes', 'cherry', 'timer', 'apple', 'watermelon', 'pear', 'strawberry'
];

const SPIN_SEQUENCE: FruitKey[] = [
    'orange', 'lemon', 'grapes', 'apple', 'strawberry', 'pear', 'watermelon', 'cherry'
];

const pseudoRandom = (seed: number) => {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

const getRoundInfo = (time: number) => {
    const roundId = Math.floor(time / (ROUND_DURATION_S * 1000));
    const roundStartTime = roundId * ROUND_DURATION_S * 1000;
    const bettingEndTime = roundStartTime + BETTING_DURATION_S * 1000;
    const roundEndTime = roundStartTime + ROUND_DURATION_S * 1000;
    return { roundId, roundStartTime, bettingEndTime, roundEndTime };
};

const determineWinnerForRound = (roundId: number): FruitKey => {
    const fruitKeys = Object.keys(FRUITS) as FruitKey[];
    const winnerIndex = Math.floor(pseudoRandom(roundId) * fruitKeys.length);
    return fruitKeys[winnerIndex];
};

export default function FruityFortunePage() {
  const [isClient, setIsClient] = useState(false);
  const [balance, setBalance] = useState(INITIAL_BALANCE);
  const [selectedBetAmount, setSelectedBetAmount] = useState(BET_AMOUNTS[0]);
  const [bets, setBets] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState(BETTING_DURATION_S);
  const [isBettingPhase, setIsBettingPhase] = useState(true);
  const [highlightedFruit, setHighlightedFruit] = useState<FruitKey | null>(null);
  const [winningFruit, setWinningFruit] = useState<FruitKey | null>(null);
  const [history, setHistory] = useState<FruitKey[]>([]);
  const [lastWinnings, setLastWinnings] = useState(0);

  const { toast } = useToast();
  const roundIdRef = useRef<number | null>(null);

  useEffect(() => {
    setIsClient(true);
    
    try {
      const savedBalance = localStorage.getItem(BALANCE_STORAGE_KEY);
      if (savedBalance !== null) {
        setBalance(JSON.parse(savedBalance));
      } else {
        localStorage.setItem(BALANCE_STORAGE_KEY, JSON.stringify(INITIAL_BALANCE));
      }
    } catch (error) {
      console.error("Failed to load balance, resetting.", error);
      setBalance(INITIAL_BALANCE);
    }
    
    const { roundId: currentRoundId } = getRoundInfo(Date.now());
    const pastWinners = Array.from({ length: 5 }, (_, i) => determineWinnerForRound(currentRoundId - 5 + i));
    setHistory(pastWinners);

  }, []);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem(BALANCE_STORAGE_KEY, JSON.stringify(balance));
    }
  }, [balance, isClient]);
  
  useEffect(() => {
    if (!isClient) return;

    const gameLoop = setInterval(() => {
        const now = Date.now();
        const { roundId, bettingEndTime, roundEndTime } = getRoundInfo(now);

        const currentlyBetting = now < bettingEndTime;
        setIsBettingPhase(currentlyBetting);

        if (currentlyBetting) {
            setTimeLeft(Math.max(0, Math.floor((bettingEndTime - now) / 1000)));
            if (winningFruit) setWinningFruit(null);
            if (roundId !== roundIdRef.current) {
                setBets({});
                setLastWinnings(0);
                roundIdRef.current = roundId;
            }
        } else {
            setTimeLeft(0);
            const spinDuration = roundEndTime - bettingEndTime;
            const timeIntoSpin = now - bettingEndTime;
            
            if (timeIntoSpin >= spinDuration - 1000) {
                const winner = determineWinnerForRound(roundId);
                if (winningFruit !== winner) {
                    setWinningFruit(winner);
                    setHighlightedFruit(winner);

                    let totalWinnings = 0;
                    if (bets[winner]) {
                        totalWinnings = bets[winner] * FRUITS[winner].multiplier;
                        setBalance(prev => prev + totalWinnings);
                    }
                    setLastWinnings(totalWinnings);
                    setHistory(prev => [winner, ...prev.slice(0, 4)]);
                }
            } else {
                const spinCount = Math.floor(timeIntoSpin / 100);
                setHighlightedFruit(SPIN_SEQUENCE[spinCount % SPIN_SEQUENCE.length]);
            }
        }
    }, 100);

    return () => clearInterval(gameLoop);
  }, [isClient, bets, winningFruit, balance]); // Added balance to dependencies

  const placeBet = (fruitId: FruitKey) => {
    if (!isBettingPhase) return;

    if (balance < selectedBetAmount) {
         toast({ title: "رصيد غير كاف", description: "لا يمكنك وضع هذا الرهان.", variant: "destructive", duration: 1000 });
         return;
    }
    
    if (Object.keys(bets).length >= 6 && !bets[fruitId]) {
        toast({ title: "حد الرهان", description: "لا يمكنك الرهان على اكثر من 6 خيارات.", variant: "destructive", duration: 2000 });
        return;
    }
    
    setBalance(prevBalance => prevBalance - selectedBetAmount);
    setBets(prevBets => ({
        ...prevBets,
        [fruitId]: (prevBets[fruitId] || 0) + selectedBetAmount,
    }));
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${Math.floor(num / 1000)}K`;
    return num.toString();
  };
  
  if (!isClient) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[#1a013b] via-[#3d026f] to-[#1a013b] text-white p-4 font-sans" dir="rtl">
        <div className="text-2xl font-bold">...تحميل اللعبة</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[#1a013b] via-[#3d026f] to-[#1a013b] text-white p-4 font-sans overflow-hidden" dir="rtl">
      <header className="w-full max-w-sm flex justify-between items-center mb-4">
         <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-2 bg-black/40 px-4 py-1 rounded-full border-2 border-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.6)]">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="gold" stroke="orange" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="filter drop-shadow-[0_0_3px_gold]"><path d="M5.52 19c.64-2.2 1.84-3 3.22-3h6.52c1.38 0 2.58.8 3.22 3"/><path d="M12 15a3 3 0 0 0-3 3c0 .62.18 1.48 1.21 2.52a4 4 0 0 0 3.58 0c1.03-1.04 1.21-1.9 1.21-2.52a3 3 0 0 0-3-3z"/><path d="M12 2v10m-4.5 3.5.07-.07A4.5 4.5 0 0 1 12 13a4.5 4.5 0 0 1 4.43 2.43l.07.07"/></svg>
                <span className="text-yellow-300 font-bold text-sm">كـروب وائـل🤐</span>
            </div>
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
                    {winningFruit && lastWinnings > 0 && (
                       <motion.div
                         key="winnings"
                         initial={{ opacity: 0, y: -50, scale: 0.5 }}
                         animate={{ opacity: 1, y: 0, scale: 1 }}
                         exit={{ opacity: 0, y: 50, transition: { duration: 0.5 } }}
                         className="absolute text-2xl font-bold text-green-400 z-10"
                       >
                         +{formatNumber(lastWinnings)}
                       </motion.div>
                    )}
                  </AnimatePresence>
                  <AnimatePresence>
                   {winningFruit && lastWinnings === 0 && Object.keys(bets).length > 0 && (
                      <motion.div key="no-win" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="flex flex-col items-center justify-center">
                         <div className="text-sm text-yellow-300 mt-1">حظاً موفقاً</div>
                      </motion.div>
                   )}
                  </AnimatePresence>
                  <AnimatePresence>
                    {isBettingPhase && (
                       <motion.div key="timer-display" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center">
                          <div className="text-5xl font-bold text-white z-0">{timeLeft}</div>
                          <div className="text-sm text-yellow-300 mt-1">وقت الرهان</div>
                       </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            }
            const fruitKey = item as FruitKey;
            const isWinning = winningFruit === fruitKey;
            const isHighlighted = !isBettingPhase && highlightedFruit === fruitKey;
            
            return (
              <div key={`${fruitKey}-${index}`} onClick={() => placeBet(fruitKey)} className={`relative flex flex-col items-center justify-center p-2 rounded-2xl cursor-pointer transition-all duration-100 aspect-square ${isWinning ? 'bg-yellow-400 scale-110 shadow-[0_0_25px_#facc15]' : isHighlighted ? 'bg-purple-600 scale-105 shadow-[0_0_15px_#a855f7]' : 'bg-black/30'} ${!isBettingPhase ? 'cursor-not-allowed opacity-70' : 'hover:bg-purple-700/80'}`}>
                <AnimatePresence>
                {bets[fruitKey] && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="absolute top-1 right-1 bg-yellow-400 text-black text-xs font-bold px-2 py-0.5 rounded-full">
                    {formatNumber(bets[fruitKey])}
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
            <button key={amount} onClick={() => isBettingPhase && setSelectedBetAmount(amount)} className={`px-3 py-1 text-xs md:text-sm font-bold rounded-full transition-all duration-300 border-2 ${selectedBetAmount === amount ? 'bg-yellow-400 text-black border-yellow-200 scale-110 shadow-[0_0_15px_#facc15]' : 'bg-black/30 text-white border-yellow-400/50 hover:bg-black/50'} ${!isBettingPhase ? 'opacity-50 cursor-not-allowed' : ''}`}>
              {formatNumber(amount)}
            </button>
          ))}
        </div>
        
        <div className="bg-black/30 w-full p-2 rounded-full flex items-center justify-between mt-1">
          <span className="text-sm font-bold text-yellow-300 ml-2">التاريخ:</span>
          <div className="flex flex-grow justify-around items-center">
            {history.map((fruitKey, index) => (
              <div key={`${fruitKey}-${index}`} className="bg-purple-900/50 p-1 rounded-full w-8 h-8 flex items-center justify-center">
                 <FruitDisplay fruitType={fruitKey} size="small" showMultiplier={false} />
              </div>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
