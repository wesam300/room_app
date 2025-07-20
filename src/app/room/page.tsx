"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Power, Share, Users, Crown, Gift, Smile, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface UserProfile {
  name: string;
  avatar: string;
  coins: number;
}

const SeatIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-yellow-300/50">
    <path d="M10 20.5c.5-.5.8-1.2.8-2 0-1.4-1.2-2.5-2.6-2.5H4c-1.1 0-2-.9-2-2v-3c0-1.1.9-2 2-2h4.2c1.4 0 2.6-1.1 2.6-2.5 0-.8-.3-1.5-.8-2" />
    <path d="M14 2c1.1 0 2 .9 2 2v16c0 1.1-.9 2-2 2" />
    <path d="M18 6h2c1.1 0 2 .9 2 2v8c0 1.1-.9 2-2 2h-2" />
  </svg>
);

const GIFTS = [
    { id: 1, name: 'Rose', cost: 10, image: 'https://placehold.co/128x128/FFC0CB/000000.gif?text=Rose' },
    { id: 2, name: 'Diamond', cost: 100, image: 'https://placehold.co/128x128/B9F2FF/000000.gif?text=Diamond' },
    { id: 3, name: 'Castle', cost: 1000, image: 'https://placehold.co/128x128/C0C0C0/000000.gif?text=Castle' },
];

const BOTS = Array.from({ length: 4 }, (_, i) => ({
  id: i + 2,
  name: `Bot ${i+2}`,
  avatar: `https://placehold.co/100x100/8B5CF6/FFFFFF.png?text=B${i + 2}`,
  isBot: true,
}));

export default function ModernRoomPage() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<{user: string, text: string}[]>([]);
  const [giftAnimation, setGiftAnimation] = useState<{ src: string, key: number } | null>(null);
  const [selectedBot, setSelectedBot] = useState<(typeof BOTS[0]) | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const profileData = localStorage.getItem('userProfile');
    if (!profileData) {
      router.push('/');
    } else {
      setUserProfile(JSON.parse(profileData));
      setChatMessages([{ user: 'System', text: `مرحبا بك في YoSo. يرجى احترام بعضكم البعض والتحدث بأدب.`}]);
    }
  }, [router]);
  
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSendMessage = () => {
    if (message.trim() && userProfile) {
      setChatMessages(prev => [...prev, {user: userProfile.name, text: message}]);
      setMessage('');
    }
  };

  const handleSendGift = (gift: typeof GIFTS[0]) => {
      if (!userProfile || !selectedBot) return;
      if (userProfile.coins < gift.cost) return;

      const updatedProfile = { ...userProfile, coins: userProfile.coins - gift.cost };
      setUserProfile(updatedProfile);
      localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
      
      setChatMessages(prev => [...prev, {user: 'Gift', text: `${userProfile.name} sent a ${gift.name} to ${selectedBot.name}!`}]);
      
      setGiftAnimation({ src: gift.image, key: Date.now() });
      setTimeout(() => setGiftAnimation(null), 3000);
  };

  if (!userProfile) {
    return <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-[#2a1a08] to-[#4e3415]">Loading...</div>;
  }
  
  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-[#4e3415] to-[#2a1a08] text-yellow-50 font-sans overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] opacity-5"></div>

        {giftAnimation && (
            <Image
            key={giftAnimation.key}
            src={giftAnimation.src}
            alt="Gift"
            width={200}
            height={200}
            className="animate-gift fixed top-0 left-1/2 -translate-x-1/2 pointer-events-none z-50"
            data-ai-hint="gift animation"
            />
        )}
      
      <header className="flex justify-between items-center p-3 z-10">
        <div className="flex items-center gap-4">
          <Power className="text-yellow-200/80" />
          <Share className="text-yellow-200/80" />
          <Users className="text-yellow-200/80" />
        </div>
        <div className="flex flex-col items-center">
            <div className="text-sm text-yellow-200/90">- للسيرفر الخاص -</div>
            <div className="text-xs text-yellow-200/70">20002081</div>
        </div>
        <div className="flex items-center gap-2">
            <div className="bg-red-800/80 border border-red-500/50 rounded-full px-3 py-0.5 flex items-center gap-1.5">
                <span className="text-sm font-bold">0</span>
                <Crown className="w-4 h-4 text-yellow-400" />
            </div>
            <Avatar className="w-8 h-8 ring-1 ring-yellow-400">
                <AvatarImage src={userProfile.avatar} alt={userProfile.name} />
                <AvatarFallback>{userProfile.name.charAt(0)}</AvatarFallback>
            </Avatar>
        </div>
      </header>

      <main className="flex-grow flex flex-col p-3 z-10">
        <div className="grid grid-cols-5 gap-y-4 gap-x-2 mb-4">
            <div className="flex flex-col items-center gap-1 cursor-pointer">
                <Avatar className="w-16 h-16 ring-2 ring-blue-400">
                    <AvatarImage src={userProfile.avatar} alt={userProfile.name} />
                    <AvatarFallback>{userProfile.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="text-xs text-yellow-200/70">{userProfile.name}</span>
            </div>
            {Array.from({ length: 4 }).map((_, i) => (
                 <Dialog key={i}>
                    <DialogTrigger asChild onClick={() => setSelectedBot(BOTS[i] ?? null)}>
                        <div className="flex flex-col items-center gap-1 cursor-pointer">
                            <div className="w-16 h-16 rounded-full border-2 border-yellow-600/70 bg-black/20 flex items-center justify-center">
                               {BOTS[i] ? (
                                    <Avatar className="w-full h-full">
                                        <AvatarImage src={BOTS[i].avatar} />
                                        <AvatarFallback>{BOTS[i].name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                ) : (
                                    <SeatIcon />
                                )}
                            </div>
                            <span className="text-xs text-yellow-200/70">{BOTS[i] ? BOTS[i].name : `no.${i + 2}`}</span>
                        </div>
                    </DialogTrigger>
                    {BOTS[i] && (
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle className="text-center">{BOTS[i].name}'s Profile</DialogTitle>
                            </DialogHeader>
                            <div className="flex flex-col items-center gap-4 py-4">
                                <Avatar className="w-24 h-24">
                                    <AvatarImage src={BOTS[i].avatar} />
                                    <AvatarFallback>{BOTS[i].name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <p>Say hi to {BOTS[i].name}!</p>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button className="bg-primary/80 hover:bg-primary"><Gift className="mr-2"/> Send Gift</Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Send a Gift to {BOTS[i].name}</DialogTitle>
                                        </DialogHeader>
                                        <div className="grid grid-cols-3 gap-4 py-4">
                                            {GIFTS.map(gift => (
                                                <div key={gift.id} className="flex flex-col items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-secondary" onClick={() => handleSendGift(gift)}>
                                                    <Image src={gift.image} alt={gift.name} width={64} height={64} data-ai-hint="animated gift" />
                                                    <p className="text-sm">{gift.name}</p>
                                                    <span className="text-xs text-yellow-400">{gift.cost.toLocaleString()}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </DialogContent>
                    )}
                </Dialog>
            ))}
        </div>

        <div className="flex-grow flex flex-col justify-end">
            <div
              ref={chatContainerRef}
              className="h-32 bg-black/20 rounded-lg p-2 overflow-y-auto text-sm space-y-2 mb-4"
            >
              {chatMessages.map((msg, i) => (
                <div key={i} className={cn(
                    'w-fit max-w-[85%] rounded-lg px-2 py-1',
                    msg.user === 'System' && 'text-yellow-400/80 text-center w-full',
                    msg.user === 'Gift' && 'text-pink-400 text-center w-full',
                    msg.user === userProfile.name ? 'bg-blue-800/50 text-blue-100 self-end' : 'bg-gray-700/50 text-gray-200'
                )}>
                    {msg.user !== 'System' && msg.user !== 'Gift' && <strong className="font-bold block">{msg.user}:</strong>}
                    <span>{msg.text}</span>
                </div>
              ))}
            </div>
        </div>
      </main>

      <footer className="z-10 p-2">
        <div className="flex items-center gap-2">
            <div className="relative flex-grow">
                <Input 
                  placeholder="قل مرحبا..." 
                  className="bg-black/30 border-yellow-600/50 rounded-full h-10 pl-4 pr-12 text-sm"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full w-8 h-8" onClick={() => {}}>
                    <Smile className="w-5 h-5 text-yellow-200/80"/>
                </Button>
            </div>
             <div className="flex items-center gap-1.5">
                <Button variant="ghost" size="icon" className="rounded-full w-10 h-10 bg-yellow-500/20 ring-2 ring-yellow-400">
                    <Gift className="w-5 h-5 text-yellow-300"/>
                </Button>
            </div>
        </div>
      </footer>
    </div>
  );
}
