'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Coins, HelpCircle, Volume2, Rocket } from "lucide-react";

type GameState = 'betting' | 'waiting' | 'flying' | 'crashed';
type Player = { name: string; bet: number | null; profit: number | null };

const PlayerList = ({ players, username }: { players: Player[], username: string }) => {
    const totalBet = players.reduce((acc, p) => acc + (p.bet || 0), 0);
    return (
        <div className="absolute top-28 left-4 w-64 space-y-2">
            <div className="text-center mb-2 bg-black/20 p-2 rounded-lg">
                <p className="text-xs text-gray-400">Total Bet</p>
                <p className="text-md font-bold text-white">{totalBet.toLocaleString()}</p>
            </div>
            {players.map((player, index) => (
                <div key={index} className={`flex items-center justify-between text-white text-sm p-2 rounded-lg ${player.name === username ? 'bg-purple-700/50 border border-purple-500' : 'bg-black/20'}`}>
                    <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={`https://placehold.co/40x40/7e22ce/ffffff.png`} alt={player.name} data-ai-hint="person" />
                            <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold">{player.name}</p>
                            <p className="text-gray-400 text-xs">{player.bet ? `${player.bet.toLocaleString()} Bet` : '--'}</p>
                        </div>
                    </div>
                    {player.profit ? (
                         <span className="text-green-400 font-bold text-lg">+{player.profit.toLocaleString()}</span>
                    ) : (
                         <Coins className="h-5 w-5 text-yellow-400" />
                    )}
                </div>
            ))}
        </div>
    );
};


const RocketIcon = ({ crashed, flying }: { crashed: boolean, flying: boolean }) => (
    <div className={`relative transition-all duration-300 ${crashed ? 'scale-150 opacity-0' : ''} ${flying ? 'animate-rocket-shake' : ''}`}>
        <Rocket className={`w-24 h-24 text-white transform -rotate-45`} />
    </div>
);

const Sparks = () => (
    <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 w-24 h-24 rotate-45">
        {[...Array(15)].map((_, i) => (
            <div
                key={i}
                className="absolute bg-orange-400 rounded-full"
                style={{
                    width: `${Math.random() * 6 + 2}px`,
                    height: `${Math.random() * 6 + 2}px`,
                    left: `${Math.random() * 100}%`,
                    bottom: `${Math.random() * -30}px`,
                    animation: `particle-up ${Math.random() * 1 + 0.5}s ease-out infinite`,
                    boxShadow: '0 0 5px #ffc107, 0 0 10px #ff9800'
                }}
            />
        ))}
    </div>
);

const Explosion = () => (
    <div className="absolute inset-0 flex items-center justify-center">
        {[...Array(20)].map((_, i) => (
            <div key={i} className="absolute rounded-full bg-gradient-to-br from-yellow-400 to-red-600"
                 style={{
                     width: `${Math.random() * 20 + 5}px`,
                     height: `${Math.random() * 20 + 5}px`,
                     transform: `rotate(${Math.random() * 360}deg) translateX(${Math.random() * 80}px) scale(0)`,
                     animation: `explode 0.7s ${i * 0.02}s ease-out forwards`
                 }}/>
        ))}
        <style jsx>{`
            @keyframes explode {
                0% { transform: scale(0); opacity: 1; }
                50% { transform: scale(1.5); opacity: 0.8; }
                100% { transform: scale(1); opacity: 0; }
            }
        `}</style>
    </div>
);

export default function CrashGamePage() {
    const [gameState, setGameState] = useState<GameState>('betting');
    const [user, setUser] = useState<{name: string, coins: number} | null>(null);
    const [usernameInput, setUsernameInput] = useState("");
    const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(true);
    
    const [players, setPlayers] = useState<Player[]>([]);
    const [currentBet, setCurrentBet] = useState<number>(0);
    const [cashedOut, setCashedOut] = useState(false);
    
    const [multiplier, setMultiplier] = useState(1.00);
    const [countdown, setCountdown] = useState(10);
    
    const countdownRef = useRef<NodeJS.Timeout>();
    const gameLoopRef = useRef<NodeJS.Timeout>();

    const resetPlayerStates = useCallback(() => {
        setPlayers(prevPlayers => prevPlayers.map(p => ({ ...p, bet: null, profit: null })));
        setCurrentBet(0);
        setCashedOut(false);
    }, []);
    
    const startBettingPhase = useCallback(() => {
        setGameState('betting');
        setMultiplier(1.00);
        resetPlayerStates();
        setCountdown(10);
        
        countdownRef.current = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(countdownRef.current);
                    startWaitingPhase();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, [resetPlayerStates]);
    
    const handleLogin = () => {
        if(usernameInput.trim()) {
            const newUser = { name: usernameInput.trim(), coins: 1000000 };
            setUser(newUser);
            setPlayers([{ name: newUser.name, bet: null, profit: null }]);
            setIsLoginDialogOpen(false);
        }
    }

    useEffect(() => {
        if (!isLoginDialogOpen) {
            startBettingPhase();
        }
        return () => {
            clearInterval(countdownRef.current);
            clearTimeout(gameLoopRef.current);
        };
    }, [isLoginDialogOpen, startBettingPhase]);

    const startWaitingPhase = () => {
        setGameState('waiting');
        setCountdown(5); // You can have a short "get ready" phase
        const waitTimeout = setTimeout(() => {
            startGameLoop();
        }, 1000); // 1 sec wait before launch
        return () => clearTimeout(waitTimeout);
    };

    const startGameLoop = () => {
        setGameState('flying');
        const crashPoint = Math.random() * 10 + 1.1; 
        
        const loop = () => {
            gameLoopRef.current = setTimeout(() => {
                setMultiplier(prev => {
                    if (gameState !== 'flying') {
                        clearTimeout(gameLoopRef.current);
                        return prev;
                    }

                    const increment = 0.01 + (prev / 150);
                    const nextMultiplier = prev + increment;
                    
                    if (nextMultiplier >= crashPoint) {
                        setGameState('crashed');
                        if (user && currentBet > 0 && !cashedOut) {
                            // User lost, no change in coins
                        }
                        setTimeout(startBettingPhase, 3000); 
                        return crashPoint;
                    }

                    loop();
                    return nextMultiplier;
                });
            }, 100);
        };
        loop();
    };

    const handlePlaceBet = (amount: number) => {
        if (gameState === 'betting' && user && user.coins >= amount) {
            const newBet = currentBet + amount;
            setCurrentBet(newBet);
            setUser(prev => prev ? { ...prev, coins: prev.coins - amount } : null);
            setPlayers(prev => prev.map(p => p.name === user.name ? {...p, bet: newBet} : p))
        }
    };

    const handleCashOut = () => {
        if (gameState === 'flying' && user && currentBet > 0 && !cashedOut) {
            const winnings = currentBet * multiplier;
            setUser(prev => prev ? { ...prev, coins: prev.coins + winnings } : null);
            setPlayers(prev => prev.map(p => p.name === user.name ? {...p, profit: winnings} : p));
            setCashedOut(true);
        }
    };
    
    const getButtonText = () => {
        if (gameState === 'betting') {
            return currentBet > 0 ? `Bet (${currentBet.toLocaleString()})` : 'Place Bet';
        }
        if (gameState === 'flying') {
            if (currentBet > 0 && !cashedOut) {
                return `Cash Out ${(currentBet * multiplier).toFixed(0).toLocaleString()}`;
            }
            if (cashedOut) {
                return `Cashed Out!`
            }
            return 'Waiting for next round';
        }
        if (gameState === 'crashed') return 'Crashed!';
        return 'Place Bet';
    }
    
    const isBettingDisabled = gameState !== 'betting';
    const isCashOutDisabled = gameState !== 'flying' || cashedOut || currentBet === 0;

    if (!user) {
         return (
             <Dialog open={isLoginDialogOpen} onOpenChange={setIsLoginDialogOpen}>
                 <DialogContent className="sm:max-w-[425px] bg-[#1a0c3e] border-purple-600/50 text-white">
                     <DialogHeader>
                         <DialogTitle className="text-center text-2xl">Welcome to Rocket Crash</DialogTitle>
                         <DialogDescription className="text-center text-gray-400">
                            Please enter your name to start playing.
                         </DialogDescription>
                     </DialogHeader>
                     <div className="grid gap-4 py-4">
                         <div className="grid grid-cols-4 items-center gap-4">
                             <Label htmlFor="name" className="text-right">
                                 Name
                             </Label>
                             <Input
                                 id="name"
                                 value={usernameInput}
                                 onChange={(e) => setUsernameInput(e.target.value)}
                                 className="col-span-3 bg-black/30 border-purple-500 focus:ring-purple-500"
                                 onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                             />
                         </div>
                     </div>
                     <DialogFooter>
                         <Button onClick={handleLogin} className="bg-yellow-500 hover:bg-yellow-600 text-purple-900 font-bold w-full">Start Playing</Button>
                     </DialogFooter>
                 </DialogContent>
             </Dialog>
         );
    }

    return (
        <div className="relative flex flex-col items-center justify-center w-full h-screen overflow-hidden bg-gradient-to-b from-[#1a0c3e] to-[#0f0524]">
             <div 
                className="absolute inset-0 bg-repeat" 
                style={{backgroundImage: 'url(https://www.transparenttextures.com/patterns/stardust.png)', opacity: 0.1}}
            />

            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center text-white z-10">
                <div className="flex items-center gap-2 bg-black/30 p-2 rounded-lg border border-purple-800/50">
                    <Coins className="h-6 w-6 text-yellow-400" />
                    <span className="font-bold text-lg">{user.coins.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon"><Volume2 /></Button>
                    <Button variant="ghost" size="icon"><HelpCircle /></Button>
                </div>
            </div>
            
            <div className="absolute top-20 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/30 p-1 px-3 rounded-full text-xs border border-purple-800/50">
                {[1.52, 1.7, 2, 8.93, 3.45, 1.12, 4.20].map((m, i) => (
                    <span key={i} className={m > 2 ? 'text-green-400' : 'text-gray-400'}>{m.toFixed(2)}x</span>
                ))}
                <span>...</span>
            </div>

            <PlayerList players={players} username={user.name} />

            <main className="relative flex-1 flex flex-col items-center justify-center text-white w-full">
                {gameState === 'betting' && (
                     <div className="text-center">
                        <div className="relative w-40 h-40 flex items-center justify-center">
                             <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                                 <circle cx="60" cy="60" r="54" fill="rgba(0,0,0,0.2)" stroke="rgba(0, 255, 255, 0.1)" strokeWidth="2" />
                                 <circle
                                     cx="60"
                                     cy="60"
                                     r="54"
                                     fill="none"
                                     stroke="cyan"
                                     strokeWidth="2"
                                     strokeDasharray={2 * Math.PI * 54}
                                     strokeDashoffset={ (2 * Math.PI * 54) * (1 - countdown / 10)}
                                     className="transition-all duration-1000 linear"
                                     strokeLinecap="round"
                                 />
                             </svg>
                             <div className="absolute flex flex-col items-center">
                                 <p className="text-gray-400 text-sm">Starting in</p>
                                 <p className="text-5xl font-bold text-cyan-300">{countdown}</p>
                             </div>
                         </div>
                     </div>
                )}
                 {gameState === 'waiting' && (
                    <div className="flex flex-col items-center text-4xl font-bold animate-pulse">
                        <p>Launching...</p>
                    </div>
                )}

                {gameState === 'flying' && (
                    <div className="text-6xl font-bold text-green-400" style={{textShadow: '0 0 15px rgba(52, 211, 153, 0.7)'}}>
                        {multiplier.toFixed(2)}x
                    </div>
                )}

                {gameState === 'crashed' && (
                     <div className="text-6xl font-bold text-red-500 animate-pulse" style={{textShadow: '0 0 15px rgba(239, 68, 68, 0.7)'}}>
                        Crashed @ {multiplier.toFixed(2)}x
                    </div>
                )}

                <div className="absolute bottom-1/3 transition-transform duration-100" style={{ transform: gameState === 'flying' ? `translateY(-${(multiplier - 1) * 80}px)` : 'translateY(0)' }}>
                   <div className="relative">
                      <RocketIcon crashed={gameState === 'crashed'} flying={gameState === 'flying'}/>
                      {gameState === 'flying' && <Sparks />}
                      {gameState === 'crashed' && <Explosion />}
                   </div>
                </div>
            </main>

            <footer className="w-full max-w-md p-4 z-10">
                <Card className="bg-black/30 border-purple-600/50 backdrop-blur-sm">
                    <CardContent className="p-3 flex flex-col gap-3">
                         <div className="flex justify-around items-center">
                            {[1000, 5000, 10000, 100000].map(amount => (
                                <Button 
                                    key={amount}
                                    onClick={() => handlePlaceBet(amount)}
                                    disabled={isBettingDisabled}
                                    className="bg-blue-800/50 hover:bg-blue-700/70 border border-blue-500 text-white rounded-md transition-all text-xs px-4 py-2 h-auto disabled:bg-gray-700/50 disabled:border-gray-600 disabled:cursor-not-allowed"
                                >
                                    {amount >= 100000 ? `${amount/1000}K` : amount.toLocaleString()}
                                </Button>
                            ))}
                        </div>
                        <Button
                          onClick={gameState === 'flying' ? handleCashOut : () => { /* No-op for betting */ }}
                          disabled={(gameState === 'betting' && currentBet === 0) || (gameState === 'flying' && isCashOutDisabled) || gameState === 'crashed'}
                          className={`w-full h-14 text-xl font-bold rounded-lg transition-all duration-300
                            ${(gameState === 'betting' && currentBet > 0) ? 'bg-yellow-500 hover:bg-yellow-600 text-purple-900 shadow-[0_0_15px_rgba(234,179,8,0.5)]' : ''}
                            ${(gameState === 'betting' && currentBet === 0) ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : ''}
                            ${(gameState === 'flying' && currentBet > 0 && !cashedOut) ? 'bg-green-500 hover:bg-green-600 text-white shadow-[0_0_15px_rgba(34,197,94,0.5)]' : ''}
                            ${(gameState === 'flying' && cashedOut) ? 'bg-purple-700 text-white cursor-not-allowed' : ''}
                            ${(gameState === 'flying' && currentBet === 0) ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : ''}
                            ${(gameState === 'crashed') ? 'bg-red-700 text-white cursor-not-allowed' : ''}
                            ${(gameState === 'waiting') ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : ''}
                          `}
                        >
                            {getButtonText()}
                        </Button>
                    </CardContent>
                </Card>
            </footer>
        </div>
    );
}
