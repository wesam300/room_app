
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Camera, User, Gamepad2, MessageSquare, Copy, ChevronLeft, Search, PlusCircle, Mic, Send, MicOff, Trophy, Users, Share2, Power, Volume2, VolumeX, Gift, Smile, XCircle, Trash2, Lock, Unlock, Crown, X, Medal, LogOut, Settings, Edit, RefreshCw, Signal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import FruityFortuneGame from "@/components/FruityFortuneGame";

// --- Types ---
interface UserProfile {
    name: string;
    image: string;
    userId: string;
}

interface Room {
    id: string;
    name: string;
    image: string;
    ownerId: string;
    description: string;
    userCount: number;
    tags?: string[];
}

interface ChatMessage {
    id: string;
    user: UserProfile;
    text: string;
}

interface MicSlot {
    user: UserProfile | null;
    isMuted: boolean;
    isLocked: boolean;
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

const ADMIN_USER_ID = 'your-admin-user-id'; // Replace with a real admin ID

const GIFTS: GiftItem[] = [
    { id: 'lion', name: 'الأسد الذهبي', price: 1000000, image: 'https://media.giphy.com/media/3o6ozmkvTZFdbEwA9u/giphy.gif' }
];

// --- MOCK DATA ---
// We will now manage rooms in state instead of a constant array.
// const ALL_ROOMS: Room[] = [ ... ];


function formatNumber(num: number): string {
    if (num >= 1000000) {
        const millions = num / 1000000;
        return millions % 1 === 0 ? `${millions}m` : `${millions.toFixed(1)}m`;
    }
    if (num >= 1000) {
        const thousands = num / 1000;
        return thousands % 1 === 0 ? `${thousands}k` : `${thousands.toFixed(1)}k`;
    }
    return num.toLocaleString('en-US');
}


function EditRoomDialog({ room, onRoomUpdated, children }: { room: Room, onRoomUpdated: (updatedRoom: Room) => void, children: React.ReactNode }) {
    const [roomName, setRoomName] = useState(room.name);
    const { toast } = useToast();
    const placeholderImage = "https://placehold.co/100x100.png";

    const handleSaveChanges = () => {
        // In a real app, you would save this to your database
        const updatedRoomData = { ...room, name: roomName, image: placeholderImage };
        onRoomUpdated(updatedRoomData);
        toast({ title: "تم تحديث الغرفة!" });
    };

    return (
        <Dialog>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-right">تعديل الغرفة</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4 text-right">
                    <div className="flex flex-col items-center gap-4">
                         <Avatar className="w-24 h-24">
                            <AvatarImage src={room.image} />
                            <AvatarFallback><Camera className="w-8 h-8" /></AvatarFallback>
                        </Avatar>
                        <p className="text-sm text-muted-foreground">سيتم استخدام صورة افتراضية.</p>
                    </div>
                     <Input
                        id="name"
                        placeholder="أدخل اسم الغرفة..."
                        value={roomName}
                        onChange={(e) => setRoomName(e.target.value)}
                        className="text-right"
                    />
                </div>
                <DialogClose asChild>
                    <Button onClick={handleSaveChanges}>حفظ التغييرات</Button>
                </DialogClose>
            </DialogContent>
        </Dialog>
    );
}

function GiftDialog({ 
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
    const [selectedRecipient, setSelectedRecipient] = useState<UserProfile | null>(null);
    const [quantity, setQuantity] = useState(1);
    const QUANTITY_OPTIONS = [1, 5, 10, 100];

    // This effect runs when the dialog is opened or the initialRecipient changes.
    // It sets the initial recipient if one is provided.
    useEffect(() => {
        if (isOpen) {
            setSelectedRecipient(initialRecipient);
        }
    }, [initialRecipient, isOpen]);

    // This effect resets the selected recipient and quantity when the dialog is closed.
    useEffect(() => {
        if (!isOpen) {
            setSelectedRecipient(null);
            setQuantity(1);
        }
    }, [isOpen]);

    const handleSendClick = (gift: GiftItem) => {
        if (selectedRecipient) {
            onSendGift(gift, selectedRecipient, quantity);
        }
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] bg-background border-primary">
                 <DialogHeader>
                    <DialogTitle className="text-right text-primary">إرسال هدية</DialogTitle>
                </DialogHeader>
                
                {!selectedRecipient ? (
                    <div className="py-4">
                        <h3 className="text-center text-lg mb-4">اختر مستلم الهدية</h3>
                        <div className="grid grid-cols-3 gap-4">
                            {usersOnMics.map(user => (
                                <button key={user.userId} onClick={() => setSelectedRecipient(user)} className="flex flex-col items-center gap-2 text-center p-2 rounded-lg hover:bg-accent">
                                    <Avatar>
                                        <AvatarImage src={user.image} alt={user.name} />
                                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <span className="text-xs truncate">{user.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="py-4 text-right">
                         <p className="text-center mb-4">إرسال هدية إلى: <span className="font-bold text-primary">{selectedRecipient.name}</span></p>
                        {GIFTS.map(gift => (
                             <div key={gift.id} className="flex flex-col items-center gap-3">
                                <img src={gift.image} data-ai-hint="lion gold" alt={gift.name} className="w-32 h-32" />
                                <div className="text-center">
                                    <p className="font-bold text-lg">{gift.name}</p>
                                    <p className="text-sm text-yellow-400">{gift.price.toLocaleString()} كوينز</p>
                                </div>
                                <div className="flex justify-center gap-2 my-2">
                                    {QUANTITY_OPTIONS.map(q => (
                                        <Button
                                            key={q}
                                            variant={quantity === q ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => setQuantity(q)}
                                        >
                                            x{q}
                                        </Button>
                                    ))}
                                </div>
                                <div className="flex justify-between items-center w-full mt-2 p-2 bg-black/30 rounded-lg">
                                     <Button size="lg" onClick={() => handleSendClick(gift)}>
                                         إرسال ({formatNumber(gift.price * quantity)})
                                     </Button>
                                     <div className="flex items-center gap-2">
                                        <span className="font-bold text-lg">{balance.toLocaleString()}</span>
                                        <Trophy className="w-6 h-6 text-yellow-400"/>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

function RoomScreen({ 
    room, 
    user, 
    onExit, 
    onRoomUpdated, 
    balance, 
    setBalance,
    setSilverBalance
}: { 
    room: Room, 
    user: UserProfile, 
    onExit: () => void, 
    onRoomUpdated: (updatedRoom: Room) => void, 
    balance: number, 
    setBalance: (updater: (prev: number) => number) => void,
    setSilverBalance: (updater: (prev: number) => number) => void
}) {
     const { toast } = useToast();
     const [micSlots, setMicSlots] = useState<MicSlot[]>(
        Array(10).fill(null).map((_, i) => i === 0 ? { user: BOT_USER, isMuted: true, isLocked: false } : { user: null, isMuted: false, isLocked: false })
     );
     const [isSpeaking, setIsSpeaking] = useState(false);
     const [isGameVisible, setIsGameVisible] = useState(false);
     
     const myMicIndex = micSlots.findIndex(slot => slot.user?.userId === user.userId);
     const isOwner = user.userId === room.ownerId;
     
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState("");
    const chatContainerRef = useRef<HTMLDivElement>(null);

    const [isGiftDialogOpen, setIsGiftDialogOpen] = useState(false);
    const [initialRecipientForGift, setInitialRecipientForGift] = useState<UserProfile | null>(null);

    const [roomSupporters, setRoomSupporters] = useState<Supporter[]>([]);
    const totalRoomSupport = roomSupporters.reduce((acc, supporter) => acc + supporter.totalGiftValue, 0);

    const [isRoomMuted, setIsRoomMuted] = useState(false);

     useEffect(() => {
        if (myMicIndex !== -1 && !micSlots[myMicIndex].isMuted) {
             const interval = setInterval(() => {
                setIsSpeaking(true);
                setTimeout(() => setIsSpeaking(false), 1500);
            }, 4000);
            return () => {
                clearInterval(interval);
                setIsSpeaking(false);
            };
        } else {
            setIsSpeaking(false);
        }
     }, [myMicIndex, micSlots]);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatMessages]);

     const handleCopyId = () => {
        navigator.clipboard.writeText(room.id);
        toast({ title: "تم نسخ ID الغرفة" });
    };

    const handleAscend = (index: number) => {
        if (myMicIndex !== -1) {
            toast({ variant: "destructive", description: "أنت بالفعل على مايك آخر."});
            return;
        }
        if (micSlots[index].user) {
            toast({ variant: "destructive", description: "هذا المايك مشغول."});
            return;
        }
        if (micSlots[index].isLocked) {
            toast({ variant: "destructive", description: "هذا المايك مقفل."});
            return;
        }
        setMicSlots(prev => {
            const newSlots = [...prev];
            newSlots[index] = { ...newSlots[index], user: user, isMuted: false };
            return newSlots;
        });
    }

    const handleDescend = (indexToDescend: number) => {
         setMicSlots(prev => {
            const newSlots = [...prev];
            if (newSlots[indexToDescend].user) {
                newSlots[indexToDescend] = { user: null, isMuted: false, isLocked: newSlots[indexToDescend].isLocked };
            }
            return newSlots;
        });
    }
    
    const handleToggleMute = () => {
        if (myMicIndex !== -1) {
            setMicSlots(prevSlots => {
                const newSlots = [...prevSlots];
                const currentSlot = newSlots[myMicIndex];
                if (currentSlot) {
                    newSlots[myMicIndex] = { ...currentSlot, isMuted: !currentSlot.isMuted };
                }
                return newSlots;
            });
        }
    };

    const handleToggleLock = (index: number) => {
        if (isOwner) {
            setMicSlots(prev => {
                const newSlots = [...prev];
                newSlots[index] = { ...newSlots[index], isLocked: !newSlots[index].isLocked };
                return newSlots;
            });
        }
    }
    
    const handleSendMessage = () => {
        if (chatInput.trim() === "") return;
        const newMessage: ChatMessage = {
            id: Date.now().toString(),
            user: user,
            text: chatInput.trim(),
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

        if (recipient.userId === user.userId) { // Simplified for client-side
            setSilverBalance(prevSilver => prevSilver + (totalCost * 0.20));
        }
        
        toast({ title: "تم إرسال الهدية!", description: `لقد أرسلت ${quantity}x ${gift.name} إلى ${recipient.name}.` });
        setIsGiftDialogOpen(false);
    };


    const handleOpenGiftDialog = (recipient: UserProfile | null) => {
        setInitialRecipientForGift(recipient);
        setIsGiftDialogOpen(true);
    };

    const usersOnMics = micSlots.map(slot => slot.user).filter((u): u is UserProfile => u !== null);

    const RoomMic = ({slot, index}: {slot: MicSlot, index: number}) => {
        const isCurrentUserOnThisMic = slot.user?.userId === user.userId;
        const isMutedForMe = isCurrentUserOnThisMic ? slot.isMuted : isRoomMuted;
        const showSpeakingAnimation = !isMutedForMe && ((isCurrentUserOnThisMic && isSpeaking) || (!isCurrentUserOnThisMic && slot.user && isSpeaking));

        const handleCopyUserId = (id: string) => {
            navigator.clipboard.writeText(id);
            toast({ title: "تم نسخ ID المستخدم" });
        };

        const triggerContent = (
             <div className="flex flex-col items-center gap-1 cursor-pointer">
                <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center relative">
                     {slot.user ? (
                        <div className="relative w-full h-full">
                            <AnimatePresence>
                                {showSpeakingAnimation && (
                                     <motion.div
                                        className="absolute inset-0 rounded-full border-2 border-yellow-300"
                                        animate={{
                                            scale: [1, 1.3, 1],
                                            opacity: [0.8, 0, 0.8],
                                        }}
                                        transition={{
                                            duration: 1.5,
                                            repeat: Infinity,
                                            ease: "easeInOut",
                                        }}
                                    />
                                )}
                            </AnimatePresence>
                            <Avatar className="w-full h-full">
                                <AvatarImage src={slot.user.image} alt={slot.user.name} />
                                <AvatarFallback>{slot.user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                             {(isCurrentUserOnThisMic ? slot.isMuted : isRoomMuted) ? (
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-full">
                                    <XCircle className="w-8 h-8 text-red-500"/>
                                </div>
                            ) : null }
                             {isOwner && slot.user.userId === user.userId && (
                                <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-black text-xs font-bold px-1.5 py-0.5 rounded-full border-2 border-background">
                                    OWNER
                                </div>
                            )}
                        </div>
                    ) : slot.isLocked ? (
                        <Lock className="w-8 h-8 text-primary/50" />
                    ) : (
                        <Mic className="w-8 h-8 text-primary" />
                    )}
                </div>
                <div className="flex items-center gap-1">
                   <span className="text-xs text-muted-foreground truncate max-w-16">
                     {slot.user ? slot.user.name : `no.${index + 1}`}
                   </span>
                </div>
            </div>
        );

        const popoverContent = (
            <div className="flex flex-col gap-2">
                {isCurrentUserOnThisMic ? (
                    <>
                        <Button variant="outline" onClick={handleToggleMute}>
                            {slot.isMuted ? "إلغاء الكتم" : "كتم المايك"}
                        </Button>
                        <Button variant="destructive" onClick={() => handleDescend(index)}>النزول من المايك</Button>
                        <Button onClick={() => handleOpenGiftDialog(user)}>إرسال هدية</Button>
                    </>
                ) : !slot.user ? (
                    isOwner ? (
                        slot.isLocked ? (
                            <Button onClick={() => handleToggleLock(index)}>فتح المايك <Unlock className="mr-2"/></Button>
                        ) : (
                            <>
                                <Button onClick={() => handleAscend(index)}>الصعود على المايك</Button>
                                <Button variant="secondary" onClick={() => handleToggleLock(index)}>قفل المايك <Lock className="mr-2"/></Button>
                            </>
                        )
                    ) : (
                         <Button onClick={() => handleAscend(index)} disabled={slot.isLocked}>الصعود على المايك</Button>
                    )
                ) : ( 
                   <div className="flex flex-col items-center gap-3 text-center">
                       <Avatar className="w-16 h-16">
                           <AvatarImage src={slot.user.image} alt={slot.user.name} />
                           <AvatarFallback>{slot.user.name.charAt(0)}</AvatarFallback>
                       </Avatar>
                       <p className="font-bold">{slot.user.name}</p>
                       <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                           <span>ID: {slot.user.userId}</span>
                           <button onClick={() => handleCopyUserId(slot.user!.userId)}>
                               <Copy className="w-3 h-3" />
                           </button>
                       </div>
                       <Button onClick={() => handleOpenGiftDialog(slot.user!)}>إرسال هدية</Button>
                       {isOwner && (
                           <Button variant="destructive" size="sm" onClick={() => handleDescend(index)}>طرد من المايك</Button>
                       )}
                   </div>
                )}
            </div>
        );

        return (
             <Popover>
                <PopoverTrigger asChild>
                   {triggerContent}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2" dir="rtl">
                   {popoverContent}
                </PopoverContent>
            </Popover>
        )
    }

    const RoomHeader = () => {
        const roomInfoContent = (
            <div className="flex items-center gap-2 p-1.5 rounded-full bg-black/20 cursor-pointer">
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
       );
   
       return (
            <header className="flex items-center justify-between p-3">
                 {isOwner ? (
                    <EditRoomDialog room={room} onRoomUpdated={onRoomUpdated}>
                        {roomInfoContent}
                    </EditRoomDialog>
                ) : (
                    roomInfoContent
                )}
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="bg-black/20 rounded-full" onClick={onExit}>
                            <ChevronLeft className="w-6 h-6 text-primary" />
                        </Button>
                    </AlertDialogTrigger>
                </AlertDialog>
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
                <GiftDialog 
                    isOpen={isGiftDialogOpen}
                    onOpenChange={setIsGiftDialogOpen}
                    usersOnMics={usersOnMics}
                    onSendGift={handleSendGift}
                    balance={balance}
                    initialRecipient={initialRecipientForGift}
                />

                <div className="flex-1 overflow-y-auto">
                    <RoomHeader />

                    <div className="flex items-center justify-between px-4 mt-2">
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
                         <div className="flex items-center gap-2">
                           <div className="flex -space-x-4 rtl:space-x-reverse">
                               <Avatar className="w-8 h-8 border-2 border-background">
                                   <AvatarImage src="https://placehold.co/100x100.png" />
                                   <AvatarFallback>A</AvatarFallback>
                               </Avatar>
                           </div>
                           <div className="w-8 h-8 rounded-full bg-primary/30 flex items-center justify-center border border-primary text-sm font-bold">1</div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-5 gap-y-4 gap-x-4 p-4">
                        {micSlots.slice(0, 5).map((slot, index) => <RoomMic key={index} slot={slot} index={index} />)}
                        {micSlots.slice(5, 10).map((slot, index) => <RoomMic key={index+5} slot={slot} index={index+5} />)}
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
                               <FruityFortuneGame balance={balance} onBalanceChange={setBalance} />
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
                           <div className="flex-1 flex items-center gap-2 bg-black/40 border border-primary/50 rounded-full p-1 pr-3 max-w-[calc(100%-14rem)]">
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
                                onClick={() => setIsRoomMuted(prev => !prev)}
                            >
                                {isRoomMuted ? <VolumeX className="w-6 h-6 text-primary" /> : <Volume2 className="w-6 h-6 text-primary" />}
                            </Button>
                             <Button 
                                variant="ghost" 
                                size="icon" 
                                className="bg-black/40 rounded-full h-12 w-12 flex-shrink-0"
                                onClick={() => handleOpenGiftDialog(null)}
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

// --- NEW PROFILE & COINS SCREEN ---

function EditProfileDialog({ user, onUserUpdate, children }: { user: UserProfile, onUserUpdate: (updatedUser: UserProfile) => void, children: React.ReactNode }) {
    const [name, setName] = useState(user.name);
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const placeholderImage = "https://placehold.co/100x100.png";

    const handleSave = () => {
        const updatedUser = { ...user, name, image: placeholderImage };
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
                        <Avatar className="w-24 h-24">
                            <AvatarImage src={user.image} />
                            <AvatarFallback><Camera className="w-8 h-8" /></AvatarFallback>
                        </Avatar>
                         <p className="text-sm text-muted-foreground">سيتم استخدام صورة افتراضية.</p>
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
        { usd: "0.49", coins: 4250 },
        { usd: "0.99", coins: 8500 },
        { usd: "4.99", coins: 42500 },
        { usd: "9.99", coins: 85000 },
        { usd: "14.99", coins: 127500 },
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
            
            {/* Balance Card */}
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

            {/* Recharge Section */}
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
                                     <span className="font-bold text-lg">{pkg.coins.toLocaleString('en-US')}</span>
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

function AdminPanel({ onAddCoins, onBanUser }: { onAddCoins: (userId: string, amount: number) => void, onBanUser: (userId: string) => void }) {
    const { toast } = useToast();
    const [addCoinsUserId, setAddCoinsUserId] = useState("");
    const [addCoinsAmount, setAddCoinsAmount] = useState("");
    const [banUserId, setBanUserId] = useState("");

    const handleAddCoins = () => {
        const amount = parseInt(addCoinsAmount, 10);
        if (!addCoinsUserId || !addCoinsAmount || isNaN(amount)) {
            toast({ variant: "destructive", title: "بيانات غير صحيحة", description: "يرجى إدخال ID ومبلغ صحيحين." });
            return;
        }
        onAddCoins(addCoinsUserId, amount);
        setAddCoinsUserId("");
        setAddCoinsAmount("");
    };

    const handleBanUser = () => {
        if (!banUserId) {
            toast({ variant: "destructive", title: "بيانات غير صحيحة", description: "يرجى إدخال ID المستخدم." });
            return;
        }
        onBanUser(banUserId);
        setBanUserId("");
    };

    return (
        <div className="mt-8 p-4 bg-black/20 rounded-lg border border-primary/30">
            <h3 className="text-lg font-bold text-center text-primary mb-4">لوحة تحكم المشرف</h3>
            <div className="space-y-6">
                {/* Add Coins Section */}
                <div className="space-y-2">
                    <h4 className="font-semibold text-right">إضافة كوينز لمستخدم</h4>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <Input
                            placeholder="User ID"
                            value={addCoinsUserId}
                            onChange={(e) => setAddCoinsUserId(e.target.value)}
                            className="text-left"
                        />
                        <Input
                            type="number"
                            placeholder="المبلغ"
                            value={addCoinsAmount}
                            onChange={(e) => setAddCoinsAmount(e.target.value)}
                             className="text-left"
                        />
                        <Button onClick={handleAddCoins} className="w-full sm:w-auto">إضافة</Button>
                    </div>
                </div>
                {/* Ban User Section */}
                <div className="space-y-2">
                    <h4 className="font-semibold text-right">حظر مستخدم</h4>
                     <div className="flex flex-col sm:flex-row gap-2">
                        <Input
                            placeholder="User ID"
                            value={banUserId}
                            onChange={(e) => setBanUserId(e.target.value)}
                            className="text-left flex-1"
                        />
                        <Button onClick={handleBanUser} variant="destructive" className="w-full sm:w-auto">حظر</Button>
                    </div>
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
    onAddCoins,
    onBanUser
}: { 
    user: UserProfile, 
    onUserUpdate: (updatedUser: UserProfile) => void, 
    balance: number, 
    silverBalance: number,
    onNavigate: (view: 'coins' | 'silver') => void,
    onLogout: () => void,
    onAddCoins: (userId: string, amount: number) => void,
    onBanUser: (userId: string) => void
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
                    <Avatar className="w-14 h-14">
                        <AvatarImage src={user.image} alt={user.name} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="text-right">
                        <h2 className="text-lg font-bold">{user.name}</h2>
                        <button onClick={handleCopyId} className="flex items-center gap-1 text-sm text-muted-foreground w-full justify-end">
                            <Copy className="w-3 h-3" />
                            <span>ID: {user.userId}</span>
                        </button>
                    </div>
                </div>
             </div>

            <div className="mt-8 flex justify-center gap-4">
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
            {isAdmin && <AdminPanel onAddCoins={onAddCoins} onBanUser={onBanUser} />}
            <Button onClick={onLogout} variant="destructive" className="mt-auto">تسجيل الخروج</Button>

        </div>
    );
}

function CreateRoomDialog({ open, onOpenChange, onCreateRoom }: { open: boolean, onOpenChange: (open: boolean) => void, onCreateRoom: (name: string, description: string) => void }) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    const handleSubmit = () => {
        if (name.trim() && description.trim()) {
            onCreateRoom(name.trim(), description.trim());
            setName('');
            setDescription('');
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


function RoomsListScreen({ rooms, onEnterRoom, onCreateRoom, user }: { rooms: Room[], onEnterRoom: (room: Room) => void, onCreateRoom: (newRoom: Room) => void, user: UserProfile }) {
    const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);
    const { toast } = useToast();

    const handleCreateRoom = (name: string, description: string) => {
        const newRoom: Room = {
            id: String(Math.floor(100000 + Math.random() * 900000)), // 6-digit random ID
            name,
            description,
            ownerId: user.userId,
            image: `https://placehold.co/150x150.png`,
            userCount: 1
        };
        onCreateRoom(newRoom);
        toast({ title: "تم إنشاء الغرفة بنجاح!" });
    };

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

function EventsScreen({ onClaimReward }: { onClaimReward: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white p-4">
            <h1 className="text-4xl font-bold mb-4 animate-pulse">الأحداث</h1>
            <p className="text-lg mb-8">استلم جائزتك اليومية!</p>
            <Button 
                onClick={onClaimReward}
                size="lg"
                className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold text-xl py-8 px-12 rounded-2xl shadow-lg transition-transform transform hover:scale-105"
            >
                استلم 10,000,000
            </Button>
        </div>
    );
}

function MainApp({ 
    user, 
    onUserUpdate, 
    onLogout,
    balance, 
    setBalance, 
    silverBalance,
    setSilverBalance
}: { 
    user: UserProfile, 
    onUserUpdate: (updatedUser: UserProfile) => void, 
    onLogout: () => void,
    balance: number, 
    setBalance: (updater: (prev: number) => number) => void,
    silverBalance: number,
    setSilverBalance: (updater: (prev: number) => number) => void
}) {
    const [view, setView] = useState<'roomsList' | 'inRoom' | 'profile' | 'events'>('roomsList');
    const [profileView, setProfileView] = useState<'profile' | 'coins' | 'silver'>('profile');
    const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
    const [allRooms, setAllRooms] = useState<Room[]>([]);

    const { toast } = useToast();

    const handleEnterRoom = (room: Room) => {
        setCurrentRoom(room);
        setView('inRoom');
    }

    const handleExitRoom = () => {
        setCurrentRoom(null);
        setView('roomsList');
    }

    const handleRoomUpdated = (updatedRoom: Room) => {
        setCurrentRoom(updatedRoom);
        setAllRooms(prevRooms => prevRooms.map(r => r.id === updatedRoom.id ? updatedRoom : r));
    };

    const handleCreateRoom = (newRoom: Room) => {
        setAllRooms(prevRooms => [newRoom, ...prevRooms]);
    };

    const handleUserUpdateAndReset = (updatedUser: UserProfile) => {
        onUserUpdate(updatedUser);
        setProfileView('profile'); // Go back to main profile view after edit
    };

    const handleConvertSilver = () => {
        setBalance(prev => prev + silverBalance);
        setSilverBalance(() => 0); // Reset silver balance
    };
    
    // Admin functions passed down for simplicity
     const handleAddCoins = (userId: string, amount: number) => {
        // In a real app, this would be a server-side call.
        // Here we just toast for demonstration.
        toast({ title: "تمت إضافة الكوينز!", description: `تم تحديث رصيد ${userId} بمقدار ${amount}.` });
        // You might want to update a local state of users if you are managing them client-side
    };

    const handleBanUser = (userId: string) => {
        toast({ title: "تم حظر المستخدم!", description: `المستخدم ${userId} لن يتمكن من الدخول للتطبيق.` });
        // You would manage a banned users list in your DB
    };

    const handleGameClick = useCallback(() => {
        toast({ title: "اللعبة موجودة داخل الغرف" });
    }, [toast]);
    
    const handleClaimEventReward = () => {
        setBalance(prev => prev + 10000000);
        toast({
            title: "🎉 مبروك! 🎉",
            description: "لقد استلمت 10,000,000 كوينز!",
        });
    };

    const renderContent = () => {
        if (view === 'inRoom' && currentRoom) {
            return (
                <RoomScreen 
                    room={currentRoom}
                    user={user} 
                    onExit={handleExitRoom} 
                    onRoomUpdated={handleRoomUpdated} 
                    balance={balance} 
                    setBalance={setBalance} 
                    setSilverBalance={setSilverBalance}
                />
            );
        }
        if (view === 'events') {
            return <EventsScreen onClaimReward={handleClaimEventReward} />;
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
                    onUserUpdate={handleUserUpdateAndReset} 
                    balance={balance} 
                    silverBalance={silverBalance}
                    onNavigate={setProfileView}
                    onLogout={onLogout}
                    onAddCoins={handleAddCoins}
                    onBanUser={handleBanUser}
                />
            );
        }
        return <RoomsListScreen rooms={allRooms} onEnterRoom={handleEnterRoom} onCreateRoom={handleCreateRoom} user={user}/>;
    };


    return (
        <div className="flex flex-col h-screen">
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
                        onClick={handleGameClick}
                        className={cn(
                            "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                        )}>
                        <Gamepad2 className="w-6 h-6" />
                        <span className="text-xs font-medium">اللعبة</span>
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

// --- Root Component & Profile Gate ---
export default function HomePage() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [nameInput, setNameInput] = useState("");
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  
  // Use local state for balance for now
  const [balance, setBalance] = useState(10000000); 
  const [silverBalance, setSilverBalance] = useState(50000);

  useEffect(() => {
    // This effect runs only on the client-side
    const savedUser = localStorage.getItem("userProfile");
    if (savedUser) {
      setUserProfile(JSON.parse(savedUser));
    }
    setIsLoading(false); // Finished loading from localStorage
  }, []);

  const handleSaveProfile = (name: string) => {
    if (name.trim()) {
      const newUserProfile: UserProfile = { 
        name: name.trim(), 
        image: `https://placehold.co/128x128.png`,
        userId: String(Math.floor(100000 + Math.random() * 900000))
      };
      setUserProfile(newUserProfile);
      localStorage.setItem("userProfile", JSON.stringify(newUserProfile));
      toast({
          title: "تم حفظ الملف الشخصي",
          description: "مرحبًا بك في التطبيق!",
      });
    } else {
       toast({
          variant: "destructive",
          title: "بيانات غير مكتملة",
          description: "يرجى إدخال الاسم.",
      });
    }
  };

  const handleUserUpdate = (updatedUser: UserProfile) => {
      setUserProfile(updatedUser);
      localStorage.setItem("userProfile", JSON.stringify(updatedUser));
  };
  
  const handleLogout = () => {
    localStorage.removeItem('userProfile');
    setUserProfile(null); 
    setNameInput("");
    toast({ title: "تم تسجيل الخروج" });
  }

  if (isLoading) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#4a2b23] text-white p-4">
            <h1 className="text-2xl font-bold">...جاري التحميل</h1>
        </div>
    );
  }


  if (!userProfile) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#4a2b23] text-white p-4">
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
                    />
                </div>

                <Button onClick={() => handleSaveProfile(nameInput)} size="lg" className="w-full mt-8 bg-primary hover:bg-primary/90 text-primary-foreground">
                    حفظ ومتابعة
                </Button>
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
            user={userProfile} 
            onLogout={handleLogout} 
            onUserUpdate={handleUserUpdate} 
            balance={balance} 
            setBalance={setBalance}
            silverBalance={silverBalance}
            setSilverBalance={setSilverBalance}
        />;
}
