
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FruitDisplay, FRUITS, FruitKey } from '@/components/fruits';
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Edit } from 'lucide-react';

const BET_AMOUNTS = [10000, 50000, 100000, 500000, 1000000];
const ROUND_DURATION = 25; // 20 seconds betting, 5 seconds result
const BETTING_DURATION = 20;
const INITIAL_BALANCE = 100000000;
const BALANCE_STORAGE_KEY = 'fruityFortuneBalance_v3';
const PROFILE_STORAGE_KEY = 'fruityFortuneProfile_v1';


const GRID_LAYOUT: (FruitKey | 'timer')[] = [
    'orange', 'lemon', 'grapes', 'cherry', 'timer', 'apple', 'watermelon', 'pear', 'strawberry'
];


const SPIN_SEQUENCE: FruitKey[] = [
    'orange', 'lemon', 'grapes', 'apple', 'strawberry', 'pear', 'watermelon', 'cherry'
];

// A predictable "random" function based on a seed
const pseudoRandom = (seed: number) => {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

interface UserProfile {
    id: string;
    name: string;
    avatar: string; // as Data URL
}

export default function FruityFortunePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [balance, setBalance] = useState<number>(INITIAL_BALANCE);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  
  const [selectedBetAmount, setSelectedBetAmount] = useState(BET_AMOUNTS[0]);
  const betsRef = useRef<Record<string, number>>({});
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

  const [tempProfileName, setTempProfileName] = useState("");
  const [tempProfileAvatar, setTempProfileAvatar] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load balance and profile from localStorage on initial mount
  useEffect(() => {
    // This effect runs only on the client side.
    try {
      const savedBalance = localStorage.getItem(BALANCE_STORAGE_KEY);
      const savedProfile = localStorage.getItem(PROFILE_STORAGE_KEY);

      if (savedProfile) {
        setUserProfile(JSON.parse(savedProfile));
        if (savedBalance !== null) {
          setBalance(JSON.parse(savedBalance));
        } else {
          setBalance(INITIAL_BALANCE);
          localStorage.setItem(BALANCE_STORAGE_KEY, JSON.stringify(INITIAL_BALANCE));
        }
      } else {
        // No profile, needs setup. Don't set balance yet.
        setIsProfileModalOpen(true);
      }
    } catch (error) {
      console.error("Error loading from localStorage, resetting state.", error);
      // If there's an error, reset to a clean state.
      localStorage.removeItem(BALANCE_STORAGE_KEY);
      localStorage.removeItem(PROFILE_STORAGE_KEY);
      setBalance(INITIAL_BALANCE);
      setUserProfile(null);
      setIsProfileModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save balance to localStorage whenever it changes
  useEffect(() => {
    // Don't save during the initial loading phase or if profile isn't set
    if (!isLoading && userProfile) {
      localStorage.setItem(BALANCE_STORAGE_KEY, JSON.stringify(balance));
    }
  }, [balance, isLoading, userProfile]);

  // Save profile to localStorage whenever it changes
   useEffect(() => {
    if (userProfile && !isLoading) {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(userProfile));
    }
  }, [userProfile, isLoading]);


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

  const updateHistory = useCallback((roundIdForHistory: number) => {
      const pastRounds = Array.from({ length: 5 }, (_, i) => roundIdForHistory - 1 - i);
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
    setIsSpinning(true);
    setWinningFruit(null);
    setHighlightedFruit(null);
    setLastWinnings(0);

    const winner = determineWinnerForRound(roundId);
    
    const totalSpins = SPIN_SEQUENCE.length * 4; 
    const finalWinnerIndex = SPIN_SEQUENCE.indexOf(winner);
    const animationDuration = 100; // 100ms per highlight
    let spinCount = 0;

    const spinInterval = setInterval(() => {
        setHighlightedFruit(SPIN_SEQUENCE[spinCount % SPIN_SEQUENCE.length]);
        spinCount++;

        if(spinCount > totalSpins + finalWinnerIndex) {
            clearInterval(spinInterval);
            setWinningFruit(winner);
            setHighlightedFruit(winner);

            let winnings = 0;
            const currentBets = betsRef.current;
            if (currentBets[winner]) { 
              winnings = currentBets[winner] * FRUITS[winner].multiplier;
              setBalance(prev => prev + winnings);
            }
            setLastWinnings(winnings);
            
            setIsSpinning(false);
            
            // Update history for the *next* round, showing this one as the latest.
            updateHistory(roundId + 1);
        }
    }, animationDuration);

  }, [determineWinnerForRound, updateHistory]);


  useEffect(() => {
    if (isLoading) return; // Don't run the main loop until everything is loaded

    const mainLoop = setInterval(() => {
      const { roundId, bettingEndTime } = getRoundInfo();
      const newIsBettingPhase = Date.now() < bettingEndTime;

      if (currentRoundId !== roundId) {
        // New round has started
        setCurrentRoundId(roundId);
        betsRef.current = {};
        setBets({});
        setLastWinnings(0); 
        setWinningFruit(null);
        setHighlightedFruit(null);
        setIsSpinning(false);
        
        // Update history to reflect the new set of past rounds
        updateHistory(roundId);
      }
      
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
  }, [isLoading, getRoundInfo, isSpinning, currentRoundId, isBettingPhase, startSpinning, updateHistory]);


  const placeBet = (fruitId: FruitKey) => {
    if (!isBettingPhase) return;

    if (balance < selectedBetAmount) {
         toast({
          title: "رصيد غير كاف",
          description: "لا يمكنك وضع هذا الرهان.",
          variant: "destructive",
          duration: 1000,
        });
        return;
    }
    
    const currentBets = betsRef.current;
    if (Object.keys(currentBets).length >= 6 && !currentBets[fruitId]) {
        toast({
          title: "حد الرهان",
          description: "لا يمكنك الرهان على اكثر من 6 خيارات.",
          variant: "destructive",
          duration: 2000,
        });
        return;
    }
    
    setBalance(prevBalance => prevBalance - selectedBetAmount);

    const newBets = { ...currentBets };
    newBets[fruitId] = (newBets[fruitId] || 0) + selectedBetAmount;
    betsRef.current = newBets;
    setBets(newBets);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempProfileAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = () => {
    if (!tempProfileName.trim() || !tempProfileAvatar) {
      toast({
        title: "بيانات غير مكتملة",
        description: "الرجاء إدخال اسمك واختيار صورة.",
        variant: "destructive",
        duration: 2000,
      });
      return;
    }
    const newProfile: UserProfile = {
      id: String(Math.floor(100000 + Math.random() * 900000)),
      name: tempProfileName,
      avatar: tempProfileAvatar,
    };
    setUserProfile(newProfile);
    // Set initial balance for the new user
    setBalance(INITIAL_BALANCE);
    setIsProfileModalOpen(false);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${Math.floor(num / 1000)}K`;
    return num.toString();
  };
  
  if (isLoading) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#1a013b] via-[#3d026f] to-[#1a013b] text-white">
            تحميل...
        </div>
    );
  }

  if (isProfileModalOpen) {
    return (
      <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
        <DialogContent className="sm:max-w-[425px] bg-gray-900 text-white border-yellow-400" dir="rtl">
            <DialogHeader>
                <DialogTitle>إنشاء ملفك الشخصي</DialogTitle>
                <DialogDescription>
                    يجب عليك إعداد ملفك الشخصي للمتابعة.
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="flex flex-col items-center gap-4">
                    <Avatar className="h-24 w-24 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <AvatarImage src={tempProfileAvatar ?? undefined} />
                        <AvatarFallback className="bg-gray-700">
                            <Edit className="h-8 w-8 text-gray-400" />
                        </AvatarFallback>
                    </Avatar>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleAvatarChange}
                        className="hidden"
                        accept="image/*"
                    />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                        الاسم
                    </Label>
                    <Input
                        id="name"
                        value={tempProfileName}
                        onChange={(e) => setTempProfileName(e.target.value)}
                        className="col-span-3 bg-gray-800 border-yellow-500 text-white"
                        placeholder="ادخل اسمك"
                    />
                </div>
            </div>
            <DialogFooter>
                <Button
                    onClick={handleSaveProfile}
                    className="bg-yellow-400 text-black hover:bg-yellow-500"
                >
                    حفظ
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[#1a013b] via-[#3d026f] to-[#1a013b] text-white p-4 font-sans overflow-hidden" dir="rtl">
      
      <header className="w-full max-w-sm flex justify-between items-center mb-4">
         <div className="flex flex-col items-center gap-1">
            {userProfile && (
              <Popover>
                <PopoverTrigger asChild>
                  <Avatar className="h-10 w-10 cursor-pointer border-2 border-yellow-400">
                    <AvatarImage src={userProfile.avatar} alt={userProfile.name} />
                    <AvatarFallback><User /></AvatarFallback>
                  </Avatar>
                </PopoverTrigger>
                <PopoverContent className="w-auto bg-black/80 border-yellow-400 text-white" dir="rtl">
                  <div className="flex flex-col items-center gap-2 p-2">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={userProfile.avatar} alt={userProfile.name} />
                      <AvatarFallback><User /></AvatarFallback>
                    </Avatar>
                    <div className="text-center">
                        <p className="font-bold text-lg">{userProfile.name}</p>
                        <p className="text-sm text-yellow-300">ID: {userProfile.id}</p>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )}
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
            const isWinning = !isBettingPhase && winningFruit === fruitKey;
            const isHighlighted = isSpinning && highlightedFruit === fruitKey;
            
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
            {history.map((fruitKey, index) => (
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
    
