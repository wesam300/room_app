"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Gift, Send, Users, Mic, Coins } from 'lucide-react';
import Image from 'next/image';

interface UserProfile {
  name: string;
  avatar: string;
  coins: number;
}

interface Message {
  id: number;
  author: string;
  content: string;
  color: string;
}

interface Bot {
  id: number;
  name: string;
  avatar: string;
}

const BOTS: Bot[] = [
  { id: 1, name: 'Nova', avatar: 'https://placehold.co/100x100/7E22CE/FFFFFF?text=N' },
  { id: 2, name: 'Orion', avatar: 'https://placehold.co/100x100/1D4ED8/FFFFFF?text=O' },
  { id: 3, name: 'Celeste', avatar: 'https://placehold.co/100x100/BE185D/FFFFFF?text=C' },
  { id: 4, name: 'Sirius', avatar: 'https://placehold.co/100x100/16A34A/FFFFFF?text=S' },
];

const GIFTS = [
    { id: 1, name: 'Star', cost: 100, image: 'https://placehold.co/128x128/FFD700/000000.gif?text=Star' },
    { id: 2, name: 'Comet', cost: 500, image: 'https://placehold.co/128x128/4B0082/FFFFFF.gif?text=Comet' },
    { id: 3, name: 'Galaxy', cost: 1000, image: 'https://placehold.co/128x128/00008B/FFFFFF.gif?text=Galaxy' },
];

export default function RoomPage() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedBot, setSelectedBot] = useState<Bot | null>(null);
  const [giftAnimation, setGiftAnimation] = useState<{ src: string, key: number } | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const profileData = localStorage.getItem('userProfile');
    if (!profileData) {
      router.push('/');
    } else {
      setUserProfile(JSON.parse(profileData));
    }
  }, [router]);
  
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim() === '' || !userProfile) return;
    const message: Message = {
      id: Date.now(),
      author: userProfile.name,
      content: newMessage,
      color: 'text-amber-400',
    };
    setMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  const handleSendGift = (gift: typeof GIFTS[0]) => {
      if (!userProfile || !selectedBot) return;
      if (userProfile.coins < gift.cost) {
          // You can add a toast notification here
          console.log("Not enough coins");
          return;
      }

      const updatedProfile = { ...userProfile, coins: userProfile.coins - gift.cost };
      setUserProfile(updatedProfile);
      localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
      
      const giftMessage: Message = {
          id: Date.now(),
          author: userProfile.name,
          content: `sent a ${gift.name} to ${selectedBot.name}!`,
          color: 'text-pink-400',
      };
      setMessages(prev => [...prev, giftMessage]);
      
      // Trigger gift animation
      setGiftAnimation({ src: gift.image, key: Date.now() });
      setTimeout(() => setGiftAnimation(null), 3000); // Animation duration
  };

  if (!userProfile) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white p-4" style={{
        backgroundImage: 'url(https://placehold.co/1920x1080/0a0a0a/444444?text=.)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
    }} data-ai-hint="space stars">
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
      <header className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2 text-lg font-bold">
          <Users />
          <span>My Awesome Room</span>
        </div>
        <div className="flex items-center gap-4 bg-black/30 p-2 rounded-full">
            <div className="flex items-center gap-2">
                <Coins className="text-yellow-400" />
                <span className="font-semibold">{userProfile.coins.toLocaleString()}</span>
            </div>
            <Avatar>
              <AvatarImage src={userProfile.avatar} />
              <AvatarFallback>{userProfile.name.charAt(0)}</AvatarFallback>
            </Avatar>
        </div>
      </header>
      
      <main className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-4 min-h-0">
        <div className="md:col-span-3 bg-black/30 rounded-lg p-4 flex flex-col justify-between">
            {/* Mic Section */}
            <div className="flex justify-around items-start p-4">
                {[userProfile, ...BOTS].slice(0, 5).map((person, index) => (
                    <Dialog key={index}>
                        <DialogTrigger asChild>
                           <div className="flex flex-col items-center gap-2 cursor-pointer" onClick={() => person !== userProfile && setSelectedBot(person as Bot)}>
                                <Avatar className="w-20 h-20 border-2 border-purple-500">
                                <AvatarImage src={person.avatar} />
                                <AvatarFallback>{person.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex items-center gap-1 text-sm bg-black/50 px-2 py-1 rounded-full">
                                    <Mic className="w-3 h-3 text-green-400" />
                                    <span>{person.name}</span>
                                </div>
                            </div>
                        </DialogTrigger>
                        {person !== userProfile && (
                             <DialogContent>
                                <DialogHeader>
                                    <DialogTitle className="text-center">{ (person as Bot).name }'s Profile</DialogTitle>
                                </DialogHeader>
                                <div className="flex flex-col items-center gap-4 py-4">
                                     <Avatar className="w-24 h-24">
                                        <AvatarImage src={(person as Bot).avatar} />
                                        <AvatarFallback>{(person as Bot).name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <p>Say hi to {(person as Bot).name}!</p>
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button><Gift className="mr-2"/> Send Gift</Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Send a Gift to {(person as Bot).name}</DialogTitle>
                                            </DialogHeader>
                                            <div className="grid grid-cols-3 gap-4 py-4">
                                                {GIFTS.map(gift => (
                                                    <div key={gift.id} className="flex flex-col items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-secondary" onClick={() => handleSendGift(gift)}>
                                                        <Image src={gift.image} alt={gift.name} width={64} height={64} data-ai-hint="animated gift" />
                                                        <p className="text-sm">{gift.name}</p>
                                                        <div className="flex items-center gap-1 text-xs">
                                                            <Coins className="w-3 h-3 text-yellow-400" />
                                                            <span>{gift.cost.toLocaleString()}</span>
                                                        </div>
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

            {/* Chat Section */}
            <div className="flex flex-col flex-grow min-h-0 mt-8">
                 <ScrollArea className="flex-grow h-40 pr-4">
                    <div className="flex flex-col gap-2">
                        {messages.map(msg => (
                            <div key={msg.id}>
                                <span className={`${msg.color} font-bold`}>{msg.author}: </span>
                                <span>{msg.content}</span>
                            </div>
                        ))}
                        <div ref={chatEndRef} />
                    </div>
                </ScrollArea>
                <div className="mt-4 flex gap-2">
                    <Input
                        placeholder="Type your message..."
                        className="bg-gray-800 border-gray-700"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <Button onClick={handleSendMessage}><Send /></Button>
                </div>
            </div>
        </div>
      </main>
    </div>
  );
}
