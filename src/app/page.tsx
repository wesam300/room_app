
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Camera, User, Gamepad2, MessageSquare, Copy, ChevronLeft, Search, PlusCircle, Mic, Send, MicOff, Trophy, Users, Share2, Power, Volume2, VolumeX, Gift, Smile, XCircle, Trash2, Lock, Unlock, Crown, X, Medal, LogOut, Settings, Edit, RefreshCw, Signal, Star, Ban } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useUser, useRooms, useChatMessages, useRoomSupporters } from "@/hooks/useFirebase";
import { motion, AnimatePresence } from "framer-motion";
import FruityFortuneGame from "@/components/FruityFortuneGame";
import RoomMic from "@/components/RoomMic";
import { RoomData, MicSlotData, roomServices, userServices, UserData } from "@/lib/firebaseServices";

// --- Types ---
interface UserProfile {
    name: string;
    image: string;
    userId: string;
}

type Room = RoomData;
export type MicSlot = MicSlotData;

interface ChatMessage {
    id: string;
    user: UserProfile;
    text: string;
    createdAt: any;
}

interface GiftItem {
    id: string;
    name: string;
    price: number;
    image: string;
}

interface Supporter {
    user: UserProfile;
    totalGiftValue: number;
}


// --- Constants ---
const BOT_USER: UserProfile = {
    name: "روكي",
    image: "https://placehold.co/100x100/A755F7/FFFFFF.png", // A distinct color for the bot
    userId: "bot-001"
};

const ADMIN_USER_ID = '368473';

const GIFTS: GiftItem[] = [
    { id: 'rose', name: 'وردة', price: 1000000, image: 'https://placehold.co/150x150/ff4d4d/ffffff.png' },
    { id: 'perfume', name: 'عطر', price: 2000000, image: 'https://placehold.co/150x150/ff8a4d/ffffff.png' },
    { id: 'car', name: 'سيارة رياضية', price: 5000000, image: 'https://placehold.co/150x150/ffc14d/ffffff.png' },
    { id: 'plane', name: 'طائرة خاصة', price: 10000000, image: 'https://placehold.co/150x150/c1ff4d/000000.png' },
    { id: 'yacht', name: 'يخت', price: 15000000, image: 'https://placehold.co/150x150/4dffc1/000000.png' },
    { id: 'castle', name: 'قلعة', price: 30000000, image: 'https://placehold.co/150x150/4dc1ff/ffffff.png' },
    { id: 'lion', name: 'الأسد الذهبي', price: 50000000, image: 'https://placehold.co/150x150/c14dff/ffffff.png' },
];

const DAILY_REWARD_AMOUNT = 10000000;


function formatNumber(num: number): string {
    if (num >= 1000000) {
        const millions = num / 1000000;
        return millions % 1 === 0 ? `${millions}m` : `${millions.toFixed(1)}m`;
    }
    if (num >= 1000) {
        const thousands = num / 1000;
        return thousands % 1 === 0 ? `${thousands.toFixed(1)}k` : `${thousands.toFixed(1)}k`;
    }
    return num.toLocaleString('en-US');
}

// New Gift Sheet Component
function GiftSheet({
    isOpen,
    onOpenChange,
    usersOnMics,
    onSendGift,
    balance,
    initialRecipient
}: {
    isOpen: boolean,
    onOpenChange: (open: boolean) => void,
    usersOnMics: UserProfile[],
    onSendGift: (gift: GiftItem, recipient: UserProfile, quantity: number) => void,
    balance: number,
    initialRecipient: UserProfile | null,
}) {
    const [selectedRecipient, setSelectedRecipient] = useState<UserProfile | null>(initialRecipient);
    const [selectedGift, setSelectedGift] = useState<GiftItem | null>(null);
    const [quantity, setQuantity] = useState(1);

    useEffect(() => {
        if (isOpen) {
            if (initialRecipient) {
                setSelectedRecipient(initialRecipient);
            } else if (usersOnMics.length > 0) {
                if (!selectedRecipient) {
                    setSelectedRecipient(usersOnMics[0]);
                }
            }
        }
    }, [isOpen, initialRecipient, usersOnMics, selectedRecipient]);

    useEffect(() => {
        if (!isOpen) {
            setSelectedGift(null);
            setQuantity(1);
            setSelectedRecipient(null);
        }
    }, [isOpen]);

    const handleSendClick = () => {
        if (selectedGift && selectedRecipient) {
            onSendGift(selectedGift, selectedRecipient, quantity);
        }
    };
    
    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent side="bottom" className="bg-background border-primary/20 rounded-t-2xl h-auto max-h-[70vh] flex flex-col p-0">
                 <SheetHeader className="p-4 text-right">
                    <SheetTitle>إرسال هدية</SheetTitle>
                    <SheetDescription>اختر مستلمًا وهدية لإرسالها.</SheetDescription>
                </SheetHeader>
                <div className="px-4 py-2 shrink-0">
                    <h3 className="text-sm font-semibold mb-2 text-right">إرسال إلى:</h3>
                    {usersOnMics.length > 0 ? (
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            {usersOnMics.map(user => (
                                <button
                                    key={user.userId}
                                    onClick={() => setSelectedRecipient(user)}
                                    className={cn(
                                        "flex flex-col items-center gap-1.5 p-2 rounded-lg transition-colors flex-shrink-0",
                                        selectedRecipient?.userId === user.userId ? "bg-primary/20" : "hover:bg-accent/50"
                                    )}
                                >
                                    <Avatar className="w-12 h-12">
                                        <AvatarImage src={user.image} alt={user.name} />
                                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <span className="text-xs truncate max-w-16">{user.name}</span>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-muted-foreground text-sm py-4">لا يوجد مستخدمون على المايك حاليًا.</p>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    <div className="grid grid-cols-4 gap-4">
                        {GIFTS.map(gift => (
                            <div
                                key={gift.id}
                                onClick={() => setSelectedGift(gift)}
                                className={cn(
                                    "relative aspect-square flex flex-col items-center justify-center p-2 rounded-lg bg-black/30 cursor-pointer transition-all border-2",
                                    selectedGift?.id === gift.id ? "border-primary" : "border-transparent hover:border-primary/50"
                                )}
                            >
                                <img src={gift.image} data-ai-hint="gift present" alt={gift.name} className="w-3/4 h-3/4 object-contain" />
                                <div className="flex items-center gap-1 mt-1">
                                    <span className="text-xs font-bold text-white">{formatNumber(gift.price)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex items-center justify-between p-4 border-t border-primary/20 mt-auto shrink-0">
                    <div className="flex items-center gap-2">
                        <Trophy className="w-6 h-6 text-yellow-400" />
                        <span className="font-bold text-lg">{formatNumber(balance)}</span>
                    </div>
                    <Button
                        size="lg"
                        onClick={handleSendClick}
                        disabled={!selectedGift || !selectedRecipient}
                    >
                        إرسال
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}

function RoomScreen({ 
    room, 
    user, 
    onExit, 
    balance, 
    setBalance,
    setSilverBalance,
}) {
    const { toast } = useToast();
    const [isGameVisible, setIsGameVisible] = useState(false);
     
    const myMicIndex = (room.micSlots || []).findIndex(slot => slot.user?.userId === user.userId);
    const isOwner = user.userId === room.ownerId;
     
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState("");
    const chatContainerRef = useRef<HTMLDivElement>(null);

    const [isGiftSheetOpen, setIsGiftSheetOpen] = useState(false);
    const [initialRecipientForGift, setInitialRecipientForGift] = useState<UserProfile | null>(null);

    const [roomSupporters, setRoomSupporters] = useState<Supporter[]>([]);
    const totalRoomSupport = roomSupporters.reduce((acc, supporter) => acc + supporter.totalGiftValue, 0);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatMessages]);

     const handleCopyId = () => {
        navigator.clipboard.writeText(room.id);
        toast({ title: "تم نسخ ID الغرفة" });
    };

    const handleUpdateRoomData = async (updates: Partial<RoomData>) => {
        try {
            await roomServices.updateRoomData(room.id, updates);
        } catch (error) {
            console.error("Error updating room data:", error);
            toast({ variant: "destructive", title: "خطأ", description: "لم يتم تحديث الغرفة. حاول مرة أخرى."});
        }
    };

    const handleAscend = (index: number) => {
        if (myMicIndex !== -1) {
            toast({ variant: "destructive", description: "أنت بالفعل على مايك آخر."});
            return;
        }
        const newSlots = [...(room.micSlots || [])];
        if (newSlots[index].user) {
            toast({ variant: "destructive", description: "هذا المايك مشغول."});
            return;
        }
        if (newSlots[index].isLocked) {
            toast({ variant: "destructive", description: "هذا المايك مقفل."});
            return;
        }
        newSlots[index] = { ...newSlots[index], user: user, isMuted: false };
        handleUpdateRoomData({ micSlots: newSlots });
    }

    const handleDescend = (indexToDescend: number) => {
        const newSlots = [...(room.micSlots || [])];
        if (newSlots[indexToDescend].user) {
            newSlots[indexToDescend] = { user: null, isMuted: false, isLocked: newSlots[indexToDescend].isLocked };
            handleUpdateRoomData({ micSlots: newSlots });
        }
    }
    
    const handleToggleMute = () => {
        if (myMicIndex !== -1) {
            const newSlots = [...(room.micSlots || [])];
            const currentSlot = newSlots[myMicIndex];
            if (currentSlot) {
                newSlots[myMicIndex] = { ...currentSlot, isMuted: !currentSlot.isMuted };
                handleUpdateRoomData({ micSlots: newSlots });
            }
        }
    };
    
    const handleToggleRoomMute = () => {
        if (isOwner) {
            handleUpdateRoomData({ isRoomMuted: !room.isRoomMuted });
        }
    };

    const handleToggleLock = (index: number) => {
        if (isOwner) {
            const newSlots = [...(room.micSlots || [])];
            newSlots[index] = { ...newSlots[index], isLocked: !newSlots[index].isLocked };
            handleUpdateRoomData({ micSlots: newSlots });
        }
    }
    
    const handleSendMessage = () => {
        if (chatInput.trim() === "") return;
        const newMessage: ChatMessage = {
            id: Date.now().toString(),
            user: user,
            text: chatInput.trim(),
            createdAt: new Date(),
        };
        setChatMessages(prev => [...prev, newMessage]);
        setChatInput("");
    };

    const handleSendGift = (gift: GiftItem, recipient: UserProfile, quantity: number) => {
        const totalCost = gift.price * quantity;

        if (balance < totalCost) {
            toast({ variant: "destructive", title: "رصيد غير كافٍ!", description: `ليس لديك ما يكفي من العملات لإرسال ${quantity}x ${gift.name}.` });
            return;
        }

        setBalance(prev => prev - totalCost);
        
        let newSupporters = [...roomSupporters];
        const existingSupporterIndex = newSupporters.findIndex(s => s.user.userId === user.userId);
        if (existingSupporterIndex !== -1) {
            const updatedSupporter = { ...newSupporters[existingSupporterIndex] };
            updatedSupporter.totalGiftValue += totalCost;
            newSupporters[existingSupporterIndex] = updatedSupporter;
        } else {
            newSupporters.push({ user, totalGiftValue: totalCost });
        }
        setRoomSupporters(newSupporters.sort((a, b) => b.totalGiftValue - a.totalGiftValue));

        setSilverBalance(prevSilver => prevSilver + (totalCost * 0.20));
        
        toast({ title: "تم إرسال الهدية!", description: `لقد أرسلت ${quantity}x ${gift.name} إلى ${recipient.name}.` });
        setIsGiftSheetOpen(false);
    };

    const handleOpenGiftSheet = (recipient: UserProfile | null) => {
        setInitialRecipientForGift(recipient);
        setIsGiftSheetOpen(true);
    };

    const usersOnMics = (room.micSlots || []).map(slot => slot.user).filter((u): u is UserProfile => u !== null);

    const RoomHeader = () => {
      return (
        <header className="flex items-center justify-between p-3">
             <div className="flex items-center gap-2">
                 {isOwner && (
                    <Button variant="ghost" size="icon" onClick={handleToggleRoomMute} className="bg-black/20 rounded-full">
                        {room.isRoomMuted ? <VolumeX className="w-6 h-6 text-primary" /> : <Volume2 className="w-6 h-6 text-primary" />}
                    </Button>
                )}
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="bg-black/20 rounded-full">
                            <X className="w-6 h-6 text-primary" />
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                            <AlertDialogDescription>
                                هل تريد حقًا مغادرة الغرفة؟
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                            <AlertDialogAction onClick={onExit}>مغادرة</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
            <div className="flex items-center gap-2 p-1.5 rounded-full bg-black/20">
              <Avatar className="w-10 h-10">
                <AvatarImage src={room.image} alt={room.name} />
                <AvatarFallback>{room.name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="text-right">
                <p className="font-bold text-sm">{room.name}</p>
                <div className="flex items-center justify-end gap-1.5">
                  <span className="text-xs text-muted-foreground">{room.id}</span>
                  <button onClick={handleCopyId} className="text-muted-foreground hover:text-foreground">
                    <Copy className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
        </header>
      )
  }

    const LeaderboardMedal = ({ rank }: { rank: number }) => {
        if (rank === 1) return <span role="img" aria-label="Gold Medal" className="text-2xl">🥇</span>;
        if (rank === 2) return <span role="img" aria-label="Silver Medal" className="text-2xl">🥈</span>;
        if (rank === 3) return <span role="img" aria-label="Bronze Medal" className="text-2xl">🥉</span>;
        return <span className="text-sm font-bold w-6 text-center">{rank}</span>;
    };

    return (
         <div className="relative flex flex-col h-screen bg-background text-foreground overflow-hidden">
             <div className="absolute inset-0 bg-cover bg-center z-0">
                <div className="absolute inset-0 bg-black/50"></div>
             </div>
             <div className="relative z-10 flex flex-col h-full">
                <GiftSheet 
                    isOpen={isGiftSheetOpen}
                    onOpenChange={setIsGiftSheetOpen}
                    usersOnMics={usersOnMics}
                    onSendGift={handleSendGift}
                    balance={balance}
                    initialRecipient={initialRecipientForGift}
                />

                <div className="flex-1 overflow-y-auto">
                    <RoomHeader />

                    <div className="flex items-center justify-between px-4 mt-2">
                        <div className="flex items-center gap-2">
                           <div className="flex -space-x-4 rtl:space-x-reverse">
                             {(room.attendees || []).slice(0, 3).map(attendee => (
                               <Avatar key={attendee.userId} className="w-8 h-8 border-2 border-background">
                                   <AvatarImage src={attendee.image} />
                                   <AvatarFallback>{attendee.name.charAt(0)}</AvatarFallback>
                               </Avatar>
                             ))}
                           </div>
                           <div className="w-8 h-8 rounded-full bg-primary/30 flex items-center justify-center border border-primary text-sm font-bold">
                                {room.userCount}
                            </div>
                        </div>
                        <Popover>
                            <PopoverTrigger asChild>
                                <button className="flex items-center gap-2 p-1 px-3 rounded-full bg-red-800/50 border border-red-500 cursor-pointer">
                                    <Trophy className="w-5 h-5 text-yellow-400"/>
                                    <span className="font-bold text-sm">{formatNumber(totalRoomSupport)}</span>
                                </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64" dir="rtl">
                                <div className="flex flex-col gap-2">
                                    <h4 className="font-bold text-center">أكبر الداعمين</h4>
                                    <hr className="border-border/50 my-1"/>
                                    {roomSupporters.length === 0 ? (
                                        <p className="text-sm text-center text-muted-foreground py-2">لا يوجد داعمين بعد</p>
                                    ) : (
                                        roomSupporters.slice(0, 10).map((supporter, index) => (
                                            <div key={supporter.user.userId} className="flex items-center justify-between gap-3 p-1 rounded-md hover:bg-accent/50">
                                                <div className="flex items-center gap-2">
                                                    <LeaderboardMedal rank={index + 1} />
                                                    <Avatar className="w-8 h-8">
                                                        <AvatarImage src={supporter.user.image} alt={supporter.user.name} />
                                                        <AvatarFallback>{supporter.user.name.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-sm font-semibold truncate">{supporter.user.name}</span>
                                                </div>
                                                <div className="flex items-center gap-1 text-yellow-400">
                                                    <Trophy className="w-4 h-4" />
                                                    <span className="text-xs font-bold">{formatNumber(supporter.totalGiftValue)}</span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                    
                    <div className="grid grid-cols-5 gap-y-2 gap-x-2 p-4">
                        {(room.micSlots || []).map((slot, index) => (
                            <RoomMic 
                                key={index}
                                room={room}
                                slot={{...slot, isMuted: slot.isMuted || room.isRoomMuted}} 
                                index={index}
                                isOwner={isOwner}
                                currentUser={user}
                                onAscend={handleAscend}
                                onDescend={handleDescend}
                                onToggleLock={handleToggleLock}
                                onToggleMute={handleToggleMute}
                                onOpenGiftDialog={handleOpenGiftSheet}
                            />
                        ))}
                    </div>
                </div>

                <AnimatePresence>
                    {isGameVisible && (
                        <motion.div 
                            className="absolute inset-x-0 bottom-0 top-[10%] bg-background z-20 rounded-t-2xl overflow-hidden"
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        >
                           <div className="relative h-full w-full">
                               <FruityFortuneGame user={user} balance={balance} onBalanceChange={(updater) => setBalance(updater)} />
                               <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="absolute top-4 right-4 bg-black/50 rounded-full text-white hover:bg-black/70 z-30"
                                    onClick={() => setIsGameVisible(false)}
                                >
                                    <X className="w-6 h-6" />
                                </Button>
                           </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                 <div className="flex-shrink-0 px-4 pb-4">
                     <div 
                        ref={chatContainerRef}
                        className="h-32 overflow-y-auto pr-2 space-y-3 mb-2"
                        style={{ maskImage: 'linear-gradient(to top, black 80%, transparent 100%)' }}
                    >
                        {chatMessages.map(msg => (
                            <div key={msg.id} className="flex items-start gap-2.5">
                                <Avatar className="w-8 h-8">
                                    <AvatarImage src={msg.user.image} />
                                    <AvatarFallback>{msg.user.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col items-start">
                                    <span className="text-sm text-muted-foreground">{msg.user.name}</span>
                                    <div className="bg-primary/20 p-2 rounded-lg rounded-tl-none">
                                        <p className="text-sm text-foreground">{msg.text}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                     <div className="relative">
                        <div className="flex items-center gap-2">
                           <div className="flex-1 flex items-center gap-2 bg-black/40 border border-primary/50 rounded-full p-1 pr-3 max-w-[calc(100%-8rem)]">
                                <Input
                                    placeholder="اكتب رسالتك..."
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    className="flex-grow bg-transparent border-none text-white placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0 h-10"
                                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                />
                                <Button size="icon" className="rounded-full bg-primary/80 hover:bg-primary" onClick={handleSendMessage}>
                                    <Send className="w-5 h-5" />
                                </Button>
                            </div>
                             <Button 
                                variant="ghost" 
                                size="icon" 
                                className="bg-black/40 rounded-full h-12 w-12 flex-shrink-0"
                                onClick={() => handleOpenGiftSheet(null)}
                            >
                                 <Gift className="w-6 h-6 text-primary" />
                            </Button>
                        </div>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="bg-black/40 rounded-full absolute bottom-16 left-0 h-12 w-12"
                            onClick={() => setIsGameVisible(true)}
                        >
                            <Gamepad2 className="w-6 h-6 text-primary" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function EditProfileDialog({ user, onUserUpdate, children }: { user: UserProfile, onUserUpdate: (updatedUser: Pick<UserProfile, 'name' | 'image'>) => void, children: React.ReactNode }) {
    const [name, setName] = useState(user.name);
    const [image, setImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setName(user.name);
            setImage(user.image);
        }
    }, [isOpen, user.name, user.image]);

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = () => {
        const updatedUser = { name, image: image || user.image };
        onUserUpdate(updatedUser);
        toast({ title: "تم تحديث الملف الشخصي!" });
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-right">تعديل الملف الشخصي</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4 text-right">
                    <div className="flex flex-col items-center gap-4">
                        <button
                            className="relative group"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Avatar className="w-24 h-24">
                                <AvatarImage src={image ?? undefined} />
                                <AvatarFallback><User className="w-8 h-8" /></AvatarFallback>
                            </Avatar>
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="w-8 h-8 text-white" />
                            </div>
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageChange}
                            accept="image/*"
                            className="hidden"
                        />
                    </div>
                    <Input
                        id="name"
                        placeholder="أدخل اسمك..."
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="text-right"
                    />
                </div>
                <Button onClick={handleSave}>حفظ التغييرات</Button>
            </DialogContent>
        </Dialog>
    );
}


function CoinsScreen({ onBack, balance }: { onBack: () => void, balance: number }) {
    const coinPackages = [
        { usd: "0.99", coins: 4500000, display: "4.5m" },
        { usd: "4.99", coins: 22500000, display: "22.5m" },
        { usd: "9.99", coins: 45000000, display: "45m" },
        { usd: "14.99", coins: 67500000, display: "67.5m" },
        { usd: "49.99", coins: 225000000, display: "225m" },
        { usd: "99.99", coins: 450000000, display: "450m" },
    ];

    return (
        <div className="p-4 flex flex-col h-full text-foreground bg-background">
            <header className="flex items-center justify-between mb-4">
                <Button variant="ghost" size="icon" onClick={onBack}>
                    <ChevronLeft className="w-6 h-6" />
                </Button>
                <h2 className="text-xl font-bold">المحفظة</h2>
                <div></div>
            </header>
            
            <div className="relative bg-gradient-to-br from-yellow-400 to-amber-500 rounded-2xl p-4 flex items-center justify-between shadow-lg mb-6 overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/checkered-light-emboss.png')] opacity-10"></div>
                <div className="flex items-center gap-4 z-10">
                    <div className="w-16 h-16 bg-white/30 rounded-full flex items-center justify-center border-2 border-white/50">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2Z" fill="#FFFFFF"/>
                            <path d="M14.25 7.6198C13.8823 7.2243 13.3855 7.00004 12.8687 7H10.5C9.75416 7 9.14165 7.42633 8.87831 8.04873M14.25 7.6198C14.811 8.13012 15.1119 8.84152 15.0833 9.58333C15.0223 11.1969 13.8471 12.4417 12.4167 12.4167H11.5833C10.1529 12.4417 8.97771 11.1969 8.91667 9.58333C8.88814 8.84152 9.18898 8.13012 9.75 7.6198M14.25 7.6198C14.75 8.13012 15 9 15 10C15 11.6569 13.6569 13 12 13C10.3431 13 9 11.6569 9 10C9 9 9.25 8.13012 9.75 7.6198M12 12.5V17M12 7V6M10 17H14" stroke="#eab308" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>
                </div>
                <div className="text-left z-10">
                    <div className="flex items-center gap-2">
                        <p className="font-bold text-purple-900">رصيد</p>
                        <RefreshCw className="w-4 h-4 text-purple-900"/>
                    </div>
                    <p className="text-3xl font-extrabold text-purple-900">{balance.toLocaleString('en-US')}</p>
                    <p className="text-xs text-purple-800/80 mt-1">يمكن استخدام الكوينز لارسال الهدايا</p>
                </div>
            </div>

            <div>
                <h3 className="font-bold text-lg mb-2 text-right">شحن</h3>
                <div className="bg-[#2a2d36] rounded-xl p-4">
                    <div className="flex justify-between items-center pb-3 border-b border-gray-600/50">
                        <ChevronLeft className="w-5 h-5 transform rotate-180 text-gray-400" />
                        <div className="flex items-center gap-2">
                             <span className="font-semibold text-lg">Google Pay</span>
                             <svg width="24" height="24" viewBox="0 0 512 512" fill="#fff" xmlns="http://www.w3.org/2000/svg"><path d="M144.3 176.4c11.3-13.8 24.3-25.8 38.4-35.8l-23-39.7C137.9 116.2 119.5 133 103.8 152c-15.5 18.8-28.8 40-39.2 62.8l43.2 25c5.3-11.7 11.4-22.6 18.3-32.6-7-10-15-19.4-24.2-28.2l-1-1.6zM368.1 176c-11.3-13.8-24.3-25.8-38.4-35.8l23-39.7c21.8 15.6 40.2 32.4 55.9 51.3 15.5 18.8 28.8 40 39.2 62.8l-43.2 25c-5.3-11.7-11.4-22.6-18.3-32.6-7-10-15-19.4-24.2-28.3v0z"/><path d="M473.4 256c0-118-99.3-214.9-217.4-214.9S38.6 138 38.6 256c0 112.5 89.2 205.3 203.4 213.8v-272.7h-67.4v86.7h-43.1v-86.7h-62.4V213h216.1v43h-216.1v-43h62.4v-43.3h43.1v43.3h67.4V213h43.1v-43h62.4V256H285.1v170.7c111.4-15.3 188.3-110.4 188.3-213.7 0 0 .1 0 .1 0z"/></svg>
                        </div>
                    </div>
                     <div className="mt-4 space-y-3">
                        {coinPackages.map((pkg, index) => (
                            <div key={index} className="flex justify-between items-center">
                                <Button className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold rounded-xl text-sm">
                                    USD {pkg.usd}
                                </Button>
                                <div className="flex items-center gap-2">
                                     <span className="font-bold text-lg">{pkg.display}</span>
                                     <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2Z" fill="#eab308"/>
                                            <path d="M14.25 7.6198C13.8823 7.2243 13.3855 7.00004 12.8687 7H10.5C9.75416 7 9.14165 7.42633 8.87831 8.04873M14.25 7.6198C14.811 8.13012 15.1119 8.84152 15.0833 9.58333C15.0223 11.1969 13.8471 12.4417 12.4167 12.4167H11.5833C10.1529 12.4417 8.97771 11.1969 8.91667 9.58333C8.88814 8.84152 9.18898 8.13012 9.75 7.6198M14.25 7.6198C14.75 8.13012 15 9 15 10C15 11.6569 13.6569 13 12 13C10.3431 13 9 11.6569 9 10C9 9 9.25 8.13012 9.75 7.6198M12 12.5V17M12 7V6M10 17H14" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function SilverScreen({ 
    onBack, 
    silverBalance, 
    onConvert
}: { 
    onBack: () => void, 
    silverBalance: number,
    onConvert: () => void
}) {
    const { toast } = useToast();

    const handleConvert = () => {
        if (silverBalance <= 0) {
            toast({ variant: "destructive", title: "ليس لديك فضة", description: "رصيد الفضة لديك هو صفر."});
            return;
        }
        onConvert();
        toast({ title: "تم الاستبدال بنجاح!", description: `تم تحويل ${silverBalance.toLocaleString()} فضة إلى كوينز.` });
    };

    return (
        <div className="p-4 flex flex-col h-full text-foreground bg-background">
            <header className="flex items-center justify-between mb-4">
                 <Button variant="ghost" size="icon" onClick={onBack}>
                    <ChevronLeft className="w-6 h-6" />
                </Button>
                <h2 className="text-xl font-bold">الفضة</h2>
                <div></div>
            </header>
            
            <div className="relative bg-gradient-to-br from-gray-500 to-gray-700 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-lg mb-6 overflow-hidden h-56">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/az-subtle.png')] opacity-20"></div>
                <div className="z-10">
                    <p className="text-lg font-bold text-gray-200">رصيد الفضة</p>
                    <p className="text-5xl font-extrabold text-white my-2">{silverBalance.toLocaleString('en-US')}</p>
                    <p className="text-xs text-gray-300 max-w-xs mx-auto">يمكنك استبدال الفضة بالكوينز لإنفاقها في التطبيق.</p>
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center">
                 <Button size="lg" className="w-full max-w-sm bg-primary hover:bg-primary/90 text-primary-foreground text-lg font-bold py-6" onClick={handleConvert}>
                    استبدال بالكوينز
                </Button>
                <p className="text-muted-foreground text-sm mt-4 text-center">
                    سيتم استبدال كل رصيدك من الفضة بالكوينز بنسبة 1:1.
                </p>
            </div>
        </div>
    );
}


function AdminPanel() {
    const { toast } = useToast();
    const [targetUserId, setTargetUserId] = useState("");
    const [amount, setAmount] = useState("");
    const [checkedUserBalance, setCheckedUserBalance] = useState<number | null>(null);
    const [targetRoomId, setTargetRoomId] = useState("");


    const handleUpdateBalance = async (operation: 'add' | 'deduct') => {
        const numAmount = parseInt(amount, 10);
        if (!targetUserId.trim() || isNaN(numAmount) || numAmount <= 0) {
            toast({ variant: "destructive", title: "بيانات غير صحيحة", description: "يرجى إدخال معرف مستخدم ومبلغ صحيحين." });
            return;
        }

        try {
            const amountToUpdate = operation === 'add' ? numAmount : -numAmount;
            await userServices.updateUserBalance(targetUserId, amountToUpdate);
            toast({ title: "تم تحديث الرصيد بنجاح!", description: `تم ${operation === 'add' ? 'إضافة' : 'خصم'} ${numAmount} إلى/من المستخدم ${targetUserId}.`});
            setTargetUserId("");
            setAmount("");
        } catch (error) {
            console.error("Admin operation failed:", error);
            toast({ variant: "destructive", title: "فشلت العملية", description: "لم يتم العثور على المستخدم أو حدث خطأ آخر." });
        }
    };

    const handleCheckBalance = async () => {
        if (!targetUserId.trim()) {
            toast({ variant: "destructive", title: "بيانات غير صحيحة", description: "يرجى إدخال معرف مستخدم." });
            return;
        }
        try {
            const user = await userServices.getUser(targetUserId.trim());
            if (user) {
                setCheckedUserBalance(user.balance);
                toast({ title: "تم العثور على المستخدم", description: `رصيد المستخدم ${targetUserId} هو ${user.balance.toLocaleString()}` });
            } else {
                setCheckedUserBalance(null);
                toast({ variant: "destructive", title: "لم يتم العثور على المستخدم", description: `لا يوجد مستخدم بالمعرف ${targetUserId}` });
            }
        } catch (error) {
            console.error("Admin check balance failed:", error);
            setCheckedUserBalance(null);
            toast({ variant: "destructive", title: "فشلت العملية", description: "حدث خطأ أثناء البحث عن المستخدم." });
        }
    };
    
    const handleSetBanStatus = async (isBanned: boolean) => {
        if (!targetUserId.trim()) {
            toast({ variant: "destructive", title: "بيانات غير صحيحة", description: "يرجى إدخال معرف مستخدم." });
            return;
        }
        try {
            await userServices.setUserBanStatus(targetUserId.trim(), isBanned);
            toast({ title: "تم تحديث حالة المستخدم", description: `تم ${isBanned ? 'حظر' : 'رفع الحظر عن'} المستخدم ${targetUserId}.` });
        } catch (error) {
            console.error("Admin set ban status failed:", error);
            toast({ variant: "destructive", title: "فشلت العملية", description: "حدث خطأ أثناء تحديث حالة المستخدم." });
        }
    };

    const handleBanRoom = async () => {
        if (!targetRoomId.trim()) {
            toast({ variant: "destructive", title: "بيانات غير صحيحة", description: "يرجى إدخال معرف غرفة صحيح." });
            return;
        }
        try {
            await roomServices.deleteRoom(targetRoomId.trim());
            toast({ title: "تم حذف الغرفة بنجاح!", description: `تم حذف الغرفة بالمعرف ${targetRoomId}.`});
            setTargetRoomId("");
        } catch (error) {
            console.error("Admin ban room failed:", error);
            toast({ variant: "destructive", title: "فشلت العملية", description: "لم يتم العثور على الغرفة أو حدث خطأ آخر." });
        }
    };


    return (
        <div className="mt-8 p-4 bg-black/20 rounded-lg border border-primary/30">
            <h3 className="text-lg font-bold text-center text-primary mb-4">لوحة تحكم المشرف</h3>
            <div className="space-y-4 text-right">
                <div className="space-y-2">
                     <Input
                        placeholder="معرف المستخدم (ID)"
                        value={targetUserId}
                        onChange={(e) => {
                            setTargetUserId(e.target.value);
                            setCheckedUserBalance(null); // Reset on ID change
                        }}
                        className="text-left"
                    />
                     {checkedUserBalance !== null && (
                        <div className="text-center bg-background/50 p-2 rounded-md">
                            <p>رصيد المستخدم المحدد: <span className="font-bold text-primary">{checkedUserBalance.toLocaleString()}</span></p>
                        </div>
                    )}
                    <Button onClick={handleCheckBalance} variant="outline" className="w-full">معرفة الرصيد</Button>
                </div>
                 <hr className="border-primary/20"/>
                 <div className="space-y-2">
                     <h4 className="font-semibold">تعديل الرصيد</h4>
                     <Input
                        type="number"
                        placeholder="المبلغ (للإضافة/الخصم)"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="text-left"
                    />
                    <div className="flex gap-2">
                        <Button onClick={() => handleUpdateBalance('add')} className="w-full">إضافة رصيد</Button>
                        <Button onClick={() => handleUpdateBalance('deduct')} variant="destructive" className="w-full">خصم رصيد</Button>
                    </div>
                </div>
                <hr className="border-primary/20"/>
                <div className="space-y-2">
                    <h4 className="font-semibold">إدارة المستخدم</h4>
                    <div className="flex gap-2">
                        <Button onClick={() => handleSetBanStatus(true)} variant="destructive" className="w-full">حظر المستخدم</Button>
                        <Button onClick={() => handleSetBanStatus(false)} className="w-full bg-green-600 hover:bg-green-700">رفع الحظر</Button>
                    </div>
                </div>
                 <hr className="border-primary/20"/>
                <div className="space-y-2">
                    <h4 className="font-semibold">إدارة الغرف</h4>
                    <Input
                        placeholder="معرف الغرفة (ID)"
                        value={targetRoomId}
                        onChange={(e) => setTargetRoomId(e.target.value)}
                        className="text-left"
                    />
                    <Button onClick={handleBanRoom} variant="destructive" className="w-full">حظر الغرفة</Button>
                </div>
            </div>
        </div>
    );
}


function ProfileScreen({ 
    user, 
    onUserUpdate, 
    balance,
    silverBalance,
    onNavigate,
    onLogout,
}: { 
    user: UserProfile, 
    onUserUpdate: (updatedUser: Pick<UserProfile, 'name' | 'image'>) => void, 
    balance: number,
    silverBalance: number,
    onNavigate: (view: 'coins' | 'silver') => void,
    onLogout: () => void,
}) {
    const { toast } = useToast();
    const isAdmin = user.userId === ADMIN_USER_ID;

    const handleCopyId = () => {
        navigator.clipboard.writeText(user.userId);
        toast({ title: "تم نسخ ID المستخدم" });
    };

    return (
        <div className="p-4 flex flex-col h-full text-foreground bg-background">
             <div className="w-full flex items-center justify-between">
                <EditProfileDialog user={user} onUserUpdate={onUserUpdate}>
                    <Button variant="ghost" size="icon">
                        <Edit className="w-5 h-5" />
                    </Button>
                </EditProfileDialog>
                <div className="flex items-center gap-3">
                    <div className="text-right">
                        <h2 className="text-lg font-bold">{user.name}</h2>
                        <button onClick={handleCopyId} className="flex items-center gap-1 text-sm text-muted-foreground w-full justify-end">
                            <Copy className="w-3 h-3" />
                            <span>ID: {user.userId}</span>
                        </button>
                    </div>
                     <Avatar className="w-14 h-14">
                        <AvatarImage src={user.image} alt={user.name} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                </div>
             </div>

             <div className="mt-8 flex justify-around items-center">
                <button onClick={() => onNavigate('coins')} className="bg-[#3e3424] rounded-2xl p-3 flex items-center justify-between w-44 h-16 shadow-md">
                    <div className="flex items-center justify-center w-12 h-12 bg-[#eab308]/50 rounded-full border-2 border-yellow-400">
                         <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2Z" fill="#eab308"/>
                            <path d="M14.25 7.6198C13.8823 7.2243 13.3855 7.00004 12.8687 7H10.5C9.75416 7 9.14165 7.42633 8.87831 8.04873M14.25 7.6198C14.811 8.13012 15.1119 8.84152 15.0833 9.58333C15.0223 11.1969 13.8471 12.4417 12.4167 12.4167H11.5833C10.1529 12.4417 8.97771 11.1969 8.91667 9.58333C8.88814 8.84152 9.18898 8.13012 9.75 7.6198M14.25 7.6198C14.75 8.13012 15 9 15 10C15 11.6569 13.6569 13 12 13C10.3431 13 9 11.6569 9 10C9 9 9.25 8.13012 9.75 7.6198M12 12.5V17M12 7V6M10 17H14" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>
                    <div className="text-right">
                        <p className="text-white font-bold">الكوينزة</p>
                        <p className="text-gray-400 text-sm">{formatNumber(balance)}</p>
                    </div>
                </button>
                <button onClick={() => onNavigate('silver')} className="bg-[#2a2d36] rounded-2xl p-3 flex items-center justify-between w-44 h-16 shadow-md">
                     <div className="flex items-center justify-center w-12 h-12 bg-[#4a4e5a] rounded-full border-2 border-gray-400">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5 16L3 5L8.5 9L12 4L15.5 9L21 5L19 16H5Z" stroke="#87CEEB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M5 20h14" stroke="#87CEEB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>
                    <div className="text-right">
                        <p className="text-white font-bold">الفضية</p>
                        <p className="text-gray-400 text-sm">{formatNumber(silverBalance)}</p>
                    </div>
                </button>
            </div>

            {isAdmin && <AdminPanel />}
            <Button onClick={onLogout} variant="destructive" className="mt-auto">تسجيل الخروج</Button>

        </div>
    );
}

function CreateRoomDialog({ open, onOpenChange, onCreateRoom }: { open: boolean, onOpenChange: (open: boolean) => void, onCreateRoom: (name: string, description: string, image: string) => void }) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = () => {
        const finalImage = imagePreview ?? 'https://placehold.co/150x150/673ab7/ffffff.png';
        if (name.trim()) {
            onCreateRoom(name.trim(), description.trim(), finalImage);
            // Reset state
            setName('');
            setDescription('');
            setImagePreview(null);
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="text-right">إنشاء غرفة جديدة</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4 text-right">
                    <button
                        className="flex flex-col items-center gap-4 cursor-pointer group relative"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Avatar className="w-24 h-24">
                            <AvatarImage src={imagePreview ?? undefined} />
                            <AvatarFallback>
                                <Camera className="w-8 h-8" />
                            </AvatarFallback>
                        </Avatar>
                         <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-sm text-white">اختر صورة</span>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageChange}
                            accept="image/*"
                            className="hidden"
                        />
                    </button>
                    <Input 
                        placeholder="اسم الغرفة" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        className="text-right"
                    />
                    <Input 
                        placeholder="وصف الغرفة" 
                        value={description} 
                        onChange={(e) => setDescription(e.target.value)}
                        className="text-right"
                    />
                </div>
                <Button onClick={handleSubmit}>إنشاء</Button>
            </DialogContent>
        </Dialog>
    );
}


function RoomsListScreen({ onEnterRoom, onCreateRoom, user }: { onEnterRoom: (room: Room) => void, onCreateRoom: (newRoom: Omit<Room, 'id' | 'userCount' | 'micSlots' | 'isRoomMuted' | 'attendees' | 'createdAt' | 'updatedAt'>) => void, user: UserProfile }) {
    const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);
    const { toast } = useToast();
    const { rooms, loading: roomsLoading, error: roomsError } = useRooms();

    const handleCreateRoom = async (name: string, description: string, image: string) => {
        const newRoomData = {
            name,
            description,
            ownerId: user.userId,
            image,
        };
        try {
            await onCreateRoom(newRoomData);
            toast({ title: "تم إنشاء الغرفة بنجاح!" });
        } catch (error) {
            console.error('Error creating room in RoomsListScreen:', error);
            toast({ 
                variant: "destructive",
                title: "خطأ في إنشاء الغرفة", 
                description: "يرجى المحاولة مرة أخرى."
            });
        }
    };

    if (roomsLoading) {
        return (
           <div className="text-center text-muted-foreground mt-20">
               <p>...جاري تحميل الغرف</p>
           </div>
       );
    }

    return (
        <div className="p-4 flex flex-col h-full text-foreground bg-background">
            <header className="flex items-center justify-between mb-4">
                <Button variant="ghost" size="icon"><Search className="w-5 h-5"/></Button>
                <h1 className="text-2xl font-bold text-primary">الغرف</h1>
                <Button variant="outline" size="icon" onClick={() => setIsCreateRoomOpen(true)}><PlusCircle className="w-5 h-5"/></Button>
            </header>
            <CreateRoomDialog open={isCreateRoomOpen} onOpenChange={setIsCreateRoomOpen} onCreateRoom={handleCreateRoom} />
            <div className="flex-1 overflow-y-auto space-y-3">
                {rooms.length === 0 ? (
                     <div className="text-center text-muted-foreground mt-20">
                        <p>لا توجد غرف متاحة حالياً.</p>
                        <p>انقر على علامة + لإنشاء غرفة جديدة!</p>
                    </div>
                ) : rooms.map(room => (
                    <div 
                        key={room.id} 
                        onClick={() => onEnterRoom(room)} 
                        className="bg-gradient-to-l from-yellow-900/20 via-yellow-600/20 to-yellow-900/20 p-0.5 rounded-2xl cursor-pointer"
                    >
                        <div className="bg-[#412c1c] rounded-2xl p-3 flex items-center gap-4">
                            <div className="relative flex-shrink-0">
                                <img src={room.image} alt={room.name} className="w-20 h-20 rounded-lg object-cover" />
                                <div className="absolute -top-2 -left-2 bg-black/50 border border-yellow-500 rounded-md px-2 py-0.5 text-xs font-bold flex items-center gap-1">
                                    <Signal className="w-3 h-3 text-green-400" />
                                    <span>{room.userCount}</span>
                                </div>
                            </div>
                            <div className="flex-1 text-right overflow-hidden">
                                <h2 className="font-bold text-lg text-white truncate">{room.name}</h2>
                                <p className="text-sm text-gray-300 truncate">{room.description}</p>
                                <div className="flex items-center justify-end gap-1 mt-1">
                                    <span className="text-xs text-gray-400">ID: {room.id}</span>
                                    <Trophy className="w-3 h-3 text-yellow-400" />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

function EventsScreen({ onClaimReward, canClaim, timeUntilNextClaim }: { onClaimReward: () => void, canClaim: boolean, timeUntilNextClaim: string }) {
    const { toast } = useToast();

    const handleClaimClick = () => {
        if (canClaim) {
            onClaimReward();
            toast({
                title: "🎉 مبروك! 🎉",
                description: `لقد استلمت ${formatNumber(DAILY_REWARD_AMOUNT)} كوينز!`,
            });
        } else {
            toast({
                variant: "destructive",
                title: "لا يمكنك الاستلام الآن",
                description: "لقد استلمت جائزتك اليومية بالفعل.",
            });
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white p-4">
            <h1 className="text-4xl font-bold mb-4 animate-pulse">الأحداث</h1>
            <p className="text-lg mb-8">استلم جائزتك اليومية!</p>
            <Button 
                onClick={handleClaimClick}
                disabled={!canClaim}
                size="lg"
                className={cn(
                    "text-black font-bold text-xl py-8 px-12 rounded-2xl shadow-lg transition-all transform hover:scale-105",
                    canClaim ? "bg-yellow-400 hover:bg-yellow-500" : "bg-gray-500 cursor-not-allowed"
                )}
            >
                {canClaim ? `استلم ${formatNumber(DAILY_REWARD_AMOUNT)}` : `الاستلام القادم بعد: ${timeUntilNextClaim}`}
            </Button>
        </div>
    );
}

function MainApp({ 
    user, 
    balance, 
    silverBalance,
    lastClaimTimestamp,
    setUserData,
    onLogout,
}: { 
    user: UserProfile, 
    balance: number, 
    silverBalance: number,
    lastClaimTimestamp: number | null,
    setUserData: (data: Partial<UserData>) => void
    onLogout: () => void,
}) {
    const [view, setView] = useState<'roomsList' | 'inRoom' | 'profile' | 'events'>('roomsList');
    const [profileView, setProfileView] = useState<'profile' | 'coins' | 'silver'>('profile');
    const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
    const [isJoiningRoom, setIsJoiningRoom] = useState(false);
    const [canClaim, setCanClaim] = useState(false);
    const [timeUntilNextClaim, setTimeUntilNextClaim] = useState('');
    const { createRoom } = useRooms();
    const { toast } = useToast();

    useEffect(() => {
        if (currentRoom) {
            const unsubscribe = roomServices.onRoomsChange((rooms) => {
                const updatedRoom = rooms.find(r => r.id === currentRoom.id);
                if (updatedRoom) {
                    setCurrentRoom(updatedRoom);
                } else {
                    // Room might have been deleted
                    setView('roomsList');
                    setCurrentRoom(null);
                }
            });
            return () => unsubscribe();
        }
    }, [currentRoom?.id]);
    
    useEffect(() => {
        const updateClaimTimer = () => {
            const now = new Date();
            const iraqTimezoneOffset = 3 * 60;
            const nowUtc = now.getTime() + (now.getTimezoneOffset() * 60 * 1000);
            const nowIraq = new Date(nowUtc + (iraqTimezoneOffset * 60 * 1000));

            const nextClaimDate = new Date(nowIraq);
            nextClaimDate.setHours(24, 0, 0, 0);

            if (lastClaimTimestamp) {
                const lastClaimDate = new Date(lastClaimTimestamp);
                const lastClaimUtc = lastClaimDate.getTime() + (lastClaimDate.getTimezoneOffset() * 60 * 1000);
                const lastClaimIraq = new Date(lastClaimUtc + (iraqTimezoneOffset * 60 * 1000));

                if (lastClaimIraq.getFullYear() === nowIraq.getFullYear() &&
                    lastClaimIraq.getMonth() === nowIraq.getMonth() &&
                    lastClaimIraq.getDate() === nowIraq.getDate()) {
                    setCanClaim(false);
                    const diff = nextClaimDate.getTime() - nowIraq.getTime();
                    const hours = Math.floor(diff / (1000 * 60 * 60));
                    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                    setTimeUntilNextClaim(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
                    return;
                }
            }
            setCanClaim(true);
            setTimeUntilNextClaim('جاهزة للاستلام!');
        };
        updateClaimTimer();
        const interval = setInterval(updateClaimTimer, 1000);
        return () => clearInterval(interval);
    }, [lastClaimTimestamp]);

    const handleEnterRoom = async (room: Room) => {
        setIsJoiningRoom(true);
        try {
            await roomServices.joinRoom(room.id, user);
            const freshRoomData = await roomServices.getRoom(room.id); 
            if (freshRoomData) {
                setCurrentRoom(freshRoomData);
                setView('inRoom');
            } else {
                 console.error("Failed to fetch fresh room data for room:", room.id);
                 toast({ variant: "destructive", title: "خطأ", description: "لم يتم العثور على الغرفة."});
            }
        } catch (error) {
            console.error("Error joining room:", error);
            toast({ variant: "destructive", title: "خطأ", description: "فشل الانضمام للغرفة."});
        } finally {
            setIsJoiningRoom(false);
        }
    }

    const handleExitRoom = async () => {
        if (currentRoom) {
            try {
                const myCurrentMicIndex = (currentRoom.micSlots || []).findIndex(slot => slot.user?.userId === user.userId);
                if(myCurrentMicIndex !== -1) {
                    const newSlots = [...(currentRoom.micSlots || [])];
                    newSlots[myCurrentMicIndex] = { user: null, isMuted: false, isLocked: newSlots[myCurrentMicIndex].isLocked };
                    await roomServices.updateRoomData(currentRoom.id, { micSlots: newSlots });
                }
                await roomServices.leaveRoom(currentRoom.id, user);
            } catch (error) {
                console.error("Error leaving room:", error);
            }
        }
        setCurrentRoom(null);
        setView('roomsList');
    }
    
    const handleUserUpdate = (updatedProfile: Pick<UserProfile, 'name' | 'image'>) => {
        setUserData({ profile: { ...user, ...updatedProfile } });
    };

    const handleBalanceChange = (updater: ((prev: number) => number) | number) => {
        const newBalance = typeof updater === 'function' ? updater(balance) : updater;
        setUserData({ balance: newBalance });
    };

    const handleSilverBalanceChange = (updater: ((prev: number) => number) | number) => {
        const newSilverBalance = typeof updater === 'function' ? updater(silverBalance) : updater;
        setUserData({ silverBalance: newSilverBalance });
    };

    const handleConvertSilver = () => {
        setUserData({ balance: balance + silverBalance, silverBalance: 0 });
    };
    
    const handleLastClaimTimestampChange = (timestamp: number | null) => {
        setUserData({ lastClaimTimestamp: timestamp });
    };

    const handleClaimEventReward = () => {
        if(canClaim){
            handleBalanceChange(prev => prev + DAILY_REWARD_AMOUNT);
            handleLastClaimTimestampChange(Date.now());
        }
    };
    
    const createRoomWrapper = async (roomData: Omit<RoomData, 'id' | 'userCount'| 'micSlots' | 'isRoomMuted' | 'attendees' | 'createdAt' | 'updatedAt'>) => {
        try {
            await createRoom(roomData);
        } catch(e) {
            console.error("Failed to create room", e);
            toast({
                variant: "destructive",
                title: "Error creating room",
                description: "Please try again later."
            })
        }
    }

    const renderContent = () => {
        if (isJoiningRoom) {
             return (
                <div className="flex items-center justify-center h-full bg-background text-foreground">
                    <p className="text-xl font-bold">...جاري تحميل الغرفة</p>
                </div>
            );
        }

        if (view === 'inRoom' && currentRoom) {
            return (
                <RoomScreen 
                    room={currentRoom}
                    user={user} 
                    onExit={handleExitRoom} 
                    balance={balance}
                    setBalance={(updater) => handleBalanceChange(updater)}
                    setSilverBalance={(updater) => handleSilverBalanceChange(updater)}
                />
            );
        }
        if (view === 'events') {
            return <EventsScreen 
                        onClaimReward={handleClaimEventReward} 
                        canClaim={canClaim} 
                        timeUntilNextClaim={timeUntilNextClaim} 
                    />;
        }
        if (view === 'profile') {
            if (profileView === 'coins') {
                return <CoinsScreen onBack={() => setProfileView('profile')} balance={balance} />;
            }
            if (profileView === 'silver') {
                return <SilverScreen onBack={() => setProfileView('profile')} silverBalance={silverBalance} onConvert={handleConvertSilver} />;
            }
            return (
                <ProfileScreen 
                    user={user} 
                    onUserUpdate={handleUserUpdate} 
                    balance={balance}
                    silverBalance={silverBalance}
                    onNavigate={setProfileView}
                    onLogout={onLogout}
                />
            );
        }
        return <RoomsListScreen onEnterRoom={handleEnterRoom} onCreateRoom={createRoomWrapper} user={user}/>;
    };


    return (
        <div className="h-screen flex flex-col">
            <main className="flex-1 overflow-y-auto bg-background">
                {renderContent()}
            </main>
             {view !== 'inRoom' && (
                 <footer className="flex justify-around items-center p-2 border-t border-border bg-background/80 backdrop-blur-sm sticky bottom-0">
                     <button 
                        onClick={() => { setView('roomsList'); setProfileView('profile'); }}
                        className={cn(
                            "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors",
                            view === 'roomsList' ? "text-primary" : "text-muted-foreground hover:text-foreground"
                        )}>
                        <MessageSquare className="w-6 h-6" />
                        <span className="text-xs font-medium">الغرف</span>
                    </button>
                    <button 
                        onClick={() => setView('events')}
                        className={cn(
                            "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors",
                            view === 'events' ? "text-primary" : "text-muted-foreground hover:text-foreground"
                        )}>
                        <Gift className="w-6 h-6" />
                        <span className="text-xs font-medium">الأحداث</span>
                    </button>
                    <button 
                        onClick={() => setView('profile')}
                        className={cn(
                            "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors",
                            view === 'profile' ? "text-primary" : "text-muted-foreground hover:text-foreground"
                        )}>
                        <User className="w-6 h-6" />
                        <span className="text-xs font-medium">أنا</span>
                    </button>
                </footer>
            )}
        </div>
    );
}

export default function HomePage() {
  const [nameInput, setNameInput] = useState("");
  const { toast } = useToast();
  
  const [userId, setUserId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const savedUserData = localStorage.getItem("userData");
      if (savedUserData) {
        try {
          const userData = JSON.parse(savedUserData);
          return userData.profile.userId;
        } catch (error) {
          console.error("Failed to parse user data from localStorage", error);
        }
      }
    }
    return null;
  });

  const { userData, loading, error, setUserData } = useUser(userId);

  const handleCreateProfile = async (name: string) => {
    if (!name.trim()) {
       toast({
          variant: "destructive",
          title: "بيانات غير مكتملة",
          description: "يرجى إدخال الاسم.",
      });
      return;
    }

    const newUserId = String(Math.floor(100000 + Math.random() * 900000));
    const newUserProfile: UserProfile = { 
      name: name.trim(), 
      image: `https://placehold.co/128x128.png`,
      userId: newUserId
    };
    
    const initialBalance = newUserId === ADMIN_USER_ID ? 1000000000 : 10000000;

    const newUserRecord: UserData = {
        profile: newUserProfile,
        balance: initialBalance,
        silverBalance: 50000,
        lastClaimTimestamp: null,
        isBanned: false,
    };

    try {
      // Save to Firebase first to ensure existence
      await userServices.saveUser(newUserRecord);
      
      // Then update local state and storage
      localStorage.setItem("userData", JSON.stringify(newUserRecord));
      setUserId(newUserId);

      toast({
          title: "تم حفظ الملف الشخصي",
          description: "مرحبًا بك في التطبيق!",
      });
      
    } catch (error) {
      console.error('Error creating profile:', error);
      toast({
          variant: "destructive",
          title: "خطأ في إنشاء الملف الشخصي",
          description: "فشل الاتصال بالخادم. يرجى المحاولة مرة أخرى.",
      });
    }
  };
  
  const handleLogout = () => {
    try {
      localStorage.removeItem('userData');
      setUserId(null); 
      setNameInput("");
      toast({ title: "تم تسجيل الخروج" });
    } catch (error) {
      console.error('Error during logout:', error);
      setUserId(null);
      setNameInput("");
      toast({ title: "تم تسجيل الخروج" });
    }
  }

  const handleSetUserData = (data: Partial<UserData>) => {
    if (userData) {
      const updatedData = { ...userData, ...data };
      setUserData(updatedData);
    }
  };


  if (loading) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background text-white p-4">
            <h1 className="text-2xl font-bold">...جاري التحميل</h1>
            {error && (
                <p className="text-red-400 mt-2">تحذير: {error}</p>
            )}
            <p className="text-gray-400 mt-4 text-sm">إذا استمر التحميل، جرب تحديث الصفحة</p>
        </div>
    );
  }

  if (userData?.isBanned) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4 text-center">
            <Ban className="w-16 h-16 text-red-500 mb-4" />
            <h1 className="text-2xl font-bold mb-4">تم حظر حسابك</h1>
            <p className="text-gray-300 mb-8">تم حظر هذا الحساب من استخدام التطبيق.</p>
            <Button onClick={handleLogout} variant="destructive">تسجيل الخروج</Button>
        </div>
    );
  }

  if (!userData) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background text-white p-4">
            <div className="w-full max-w-sm text-center">
                <h1 className="text-2xl font-bold mb-4">إنشاء ملف شخصي</h1>
                <p className="text-gray-300 mb-8">أكمل ملفك الشخصي للمتابعة</p>
                
                <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-primary">
                    <AvatarImage src="https://placehold.co/128x128.png" />
                    <AvatarFallback><Camera/></AvatarFallback>
                </Avatar>
                <p className="text-sm text-muted-foreground mb-4">سيتم استخدام صورة افتراضية.</p>

                <div className="space-y-4 text-right">
                     <Input 
                        placeholder="أدخل اسمك..."
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                        onKeyPress={(e) => e.key === 'Enter' && handleCreateProfile(nameInput)}
                    />
                </div>

                <Button 
                    onClick={() => handleCreateProfile(nameInput)} 
                    size="lg" 
                    className="w-full mt-8 bg-primary hover:bg-primary/90 text-primary-foreground"
                    disabled={!nameInput.trim()}
                >
                    حفظ ومتابعة
                </Button>
                
                {error && (
                    <p className="text-red-400 mt-4 text-sm">تحذير: لا يمكن الاتصال بـ Firebase. سيتم حفظ البيانات محلياً.</p>
                )}
                
                <p className="text-gray-400 mt-4 text-xs">
                    اضغط Enter أو انقر على الزر لحفظ الملف الشخصي
                </p>
            </div>
             <div className="text-center text-xs text-gray-300 pt-8">
                <p>من خلال الاستمرار، فإنك توافق على</p>
                <p>
                    <Link href="#" className="underline">شروط الخدمة</Link> و <Link href="#" className="underline">سياسة الخصوصية</Link>
                </p>
            </div>
        </div>
    );
  }

  return <MainApp 
            user={userData.profile} 
            balance={userData.balance}
            silverBalance={userData.silverBalance}
            lastClaimTimestamp={userData.lastClaimTimestamp}
            setUserData={handleSetUserData}
            onLogout={handleLogout}
        />;
}
