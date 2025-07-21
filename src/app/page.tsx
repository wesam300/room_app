
"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FruitDisplay, FRUITS, FruitKey } from '@/components/fruits';
import { useToast } from "@/hooks/use-toast";

const BET_AMOUNTS = [10000, 50000, 100000, 500000, 1000000];
const ROUND_DURATION = 25; // 20 seconds betting, 5 seconds result
const BETTING_DURATION = 20;

const GRID_LAYOUT: (FruitKey | 'timer')[] = [
    'watermelon', 'cherry',     'orange',
    'pear',       'timer',      'lemon',
    'strawberry', 'apple',      'grapes',
];

const SPIN_SEQUENCE: FruitKey[] = [
    'orange', 'lemon', 'grapes', 'apple', 'strawberry', 'pear', 'watermelon', 'cherry'
];

// A predictable "random" function based on a seed
const pseudoRandom = (seed: number) => {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

export default function FruityFortunePage() {
  const [balance, setBalance] = useState(10000000);
  const [selectedBetAmount, setSelectedBetAmount] = useState(BET_AMOUNTS[0]);
  const [bets, setBets] = useState<Record<string, number>>({});
  const [currentRoundId, setCurrentRoundId] = useState(0);
  
  const [timer, setTimer] = useState(BETTING_DURATION);
  const [isBettingPhase, setIsBettingPhase] = useState(true);
  const [isSpinning, setIsSpinning] = useState(false);
  
  const [highlightedFruit, setHighlightedFruit] = useState<FruitKey | null>(null);
  const [winningFruit, setWinningFruit] = useState<FruitKey | null>(null);
  const [history, setHistory] = useState<FruitKey[]>([]);
  const [lastWinnings, setLastWinnings] = useState(0);
  const { toast } = useToast();

  const getRoundInfo = useCallback(() => {
    const now = Date.now();
    const roundId = Math.floor(now / (ROUND_DURATION * 1000));
    const roundStartTime = roundId * ROUND_DURATION * 1000;
    const bettingEndTime = roundStartTime + BETTING_DURATION * 1000;
    
    return { roundId, roundStartTime, bettingEndTime };
  }, []);
  
  const determineWinnerForRound = useCallback((roundId: number): FruitKey => {
      const fruitKeys = Object.keys(FRUITS) as FruitKey[];
      const winnerIndex = Math.floor(pseudoRandom(roundId) * fruitKeys.length);
      return fruitKeys[winnerIndex];
  }, []);

  const updateHistory = useCallback((currentRoundId: number) => {
    const pastRounds = Array.from({ length: 5 }, (_, i) => currentRoundId - 1 - i);
    const pastWinners = pastRounds.map(id => determineWinnerForRound(id));
    setHistory(pastWinners);
  }, [determineWinnerForRound]);


  // Initialize component state
  useEffect(() => {
    const { roundId } = getRoundInfo();
    setCurrentRoundId(roundId);
    updateHistory(roundId);
  }, [getRoundInfo, updateHistory]);


  const startSpinning = useCallback((roundId: number) => {
    const totalBet = Object.values(bets).reduce((sum, amount) => sum + amount, 0);
    
    if (totalBet > 0) {
      if (totalBet > balance) {
        toast({
          title: "رصيد غير كاف",
          description: "إجمالي رهانك يتجاوز رصيدك الحالي.",
          variant: "destructive",
        });
      }
      setBalance(prev => prev - totalBet);
    }
    
    setIsSpinning(true);
    setWinningFruit(null);
    setLastWinnings(0);

    const winner = determineWinnerForRound(roundId);
    
    const totalSpins = SPIN_SEQUENCE.length * 2;
    const finalWinnerIndex = SPIN_SEQUENCE.indexOf(winner);
    const animationDuration = 100;
    let spinCount = 0;

    const spinInterval = setInterval(() => {
        setHighlightedFruit(SPIN_SEQUENCE[spinCount % SPIN_SEQUENCE.length]);
        spinCount++;

        if(spinCount > totalSpins + finalWinnerIndex) {
            clearInterval(spinInterval);
            setWinningFruit(winner);
            setHighlightedFruit(winner);

            let winnings = 0;
            if (bets[winner]) { 
              winnings = bets[winner] * FRUITS[winner].multiplier;
              setBalance(prev => prev + winnings);
            }
            setLastWinnings(winnings);
            
            // The history will be updated when the next round starts.
            // This ensures the "new" tag is on the absolute last winner.
            
            setIsSpinning(false);
        }
    }, animationDuration);

  }, [bets, balance, toast, determineWinnerForRound]);


  useEffect(() => {
    const mainLoop = setInterval(() => {
      const { roundId, bettingEndTime } = getRoundInfo();

      if (currentRoundId !== roundId) {
        // New round has started
        setCurrentRoundId(roundId);
        setBets({});
        setLastWinnings(0); 
        setWinningFruit(null);
        setHighlightedFruit(null);
        setIsSpinning(false);
        
        // Update history for the new round, showing the winner of the *previous* round as the newest.
        updateHistory(roundId);
      }
      
      const newIsBettingPhase = Date.now() < bettingEndTime;

      if (isBettingPhase && !newIsBettingPhase && !isSpinning) {
        // Betting phase just ended, start spinning
        startSpinning(roundId);
      }

      setIsBettingPhase(newIsBettingPhase);

      if (newIsBettingPhase) {
        const timeLeft = Math.max(0, Math.floor((bettingEndTime - Date.now()) / 1000));
        setTimer(timeLeft);
      } else {
        setTimer(0);
      }

    }, 500);

    return () => clearInterval(mainLoop);
  }, [getRoundInfo, startSpinning, isSpinning, currentRoundId, isBettingPhase, updateHistory]);


  const placeBet = (fruitId: FruitKey) => {
    if (!isBettingPhase) return;
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
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="gold" stroke="orange" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="filter drop-shadow-[0_0_3px_gold]">
                <path d="M12 2L9 9h6l-3-7z"/>
                <path d="M5 22s1.5-2 5-2 5 2 5 2H5z"/>
                <path d="M12 12a5 5 0 0 0-5 5h10a5 5 0 0 0-5-5z"/>
            </svg>
            <span className="text-yellow-300 font-bold text-sm">كـروب وائـل🤐</span>
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
                    {lastWinnings > 0 && !isBettingPhase && (
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
                   {!isBettingPhase && lastWinnings === 0 && winningFruit && (
                      <div className="flex flex-col items-center justify-center">
                         <div className="text-sm text-yellow-300 mt-1">حظاً موفقاً</div>
                      </div>
                   )}
                   </AnimatePresence>
                   <AnimatePresence>
                    {isBettingPhase && (
                       <motion.div
                         key="timer"
                         initial={{ opacity: 0 }}
                         animate={{ opacity: 1 }}
                         exit={{ opacity: 0 }}
                         className="flex flex-col items-center justify-center"
                       >
                          <div className="text-5xl font-bold text-white z-0">{timer}</div>
                          <div className="text-sm text-yellow-300 mt-1">وقت الرهان</div>
                       </motion.div>
                    )}
                   </AnimatePresence>
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
          <div className="flex flex-grow justify-around items-center">
            {history.slice(0, 5).map((fruitKey, index) => (
              <div key={index} className="bg-purple-900/50 p-1 rounded-full w-8 h-8 flex items-center justify-center">
                 <FruitDisplay fruitType={fruitKey} size="small" showMultiplier={false} isNew={index === 0} />
              </div>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
