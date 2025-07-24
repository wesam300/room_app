
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Camera, User, Gamepad2, MessageSquare, Copy, ChevronLeft, Search, PlusCircle, Mic, Send, MicOff, Trophy, Users, Share2, Power, Volume2, VolumeX, Gift, Smile, XCircle, Trash2, Lock, Unlock, Crown, X, Medal, LogOut } from "lucide-react";
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

const GIFTS: GiftItem[] = [
    { id: 'lion', name: 'الأسد الذهبي', price: 1000000, image: 'https://media.giphy.com/media/3o6ozmkvTZFdbEwA9u/giphy.gif' }
];

function formatNumber(num: number) {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1).replace('.0', '')}m`;
    if (num >= 1000) return `${(num / 1000).toFixed(1).replace('.0', '')}k`;
    return num.toString();
}

// --- Rooms Feature Components ---

function CreateRoomDialog({ user, onRoomCreated }: { user: UserProfile, onRoomCreated: (room: Room) => void }) {
    const [roomName, setRoomName] = useState("");
    const [roomImage, setRoomImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => setRoomImage(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleCreateRoom = () => {
        if (!roomName || !roomImage) {
            toast({ variant: "destructive", title: "بيانات غير مكتملة", description: "يرجى إدخال اسم للغرفة واختيار صورة." });
            return;
        }

        const newRoom: Room = {
            id: Math.floor(100000 + Math.random() * 900000).toString(),
            name: roomName,
            image: roomImage,
            ownerId: user.userId,
        };

        const existingRooms: Room[] = JSON.parse(localStorage.getItem('userRooms') || '[]');
        localStorage.setItem('userRooms', JSON.stringify([...existingRooms, newRoom]));
        
        toast({ title: "تم إنشاء الغرفة بنجاح!" });
        onRoomCreated(newRoom);
        setIsOpen(false);
        setRoomName("");
        setRoomImage(null);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                 <Button variant="ghost" size="sm">
                    <PlusCircle className="ml-2 h-4 w-4" />
                    إنشاء غرفة
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-right">إنشاء غرفة جديدة</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4 text-right">
                    <div className="flex flex-col items-center gap-4">
                        <Avatar className="w-24 h-24 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            <AvatarImage src={roomImage || ''} />
                            <AvatarFallback><Camera className="w-8 h-8" /></AvatarFallback>
                        </Avatar>
                        <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
                    </div>
                     <Input
                        id="name"
                        placeholder="أدخل اسم الغرفة..."
                        value={roomName}
                        onChange={(e) => setRoomName(e.target.value)}
                        className="text-right"
                    />
                </div>
                 <Button onClick={handleCreateRoom} type="submit">إنشاء</Button>
            </DialogContent>
        </Dialog>
    );
}

function RoomsListScreen({ user, onEnterRoom, onRoomUpdated }: { user: UserProfile, onEnterRoom: (room: Room) => void, onRoomUpdated: (updatedRoom: Room) => void }) {
    const [myRooms, setMyRooms] = useState<Room[]>([]);
    
    useEffect(() => {
        const rooms = JSON.parse(localStorage.getItem('userRooms') || '[]') as Room[];
        setMyRooms(rooms);
    }, []);


    const handleRoomCreated = (newRoom: Room) => {
        setMyRooms(prev => [...prev, newRoom]);
        onEnterRoom(newRoom);
    }
    
    const handleDeleteRoom = (roomIdToDelete: string) => {
        const updatedRooms = myRooms.filter(room => room.id !== roomIdToDelete);
        setMyRooms(updatedRooms);
        localStorage.setItem('userRooms', JSON.stringify(updatedRooms));
    };


    return (
        <div className="flex flex-col h-full">
            <header className="flex items-center justify-between p-2 border-b">
                <CreateRoomDialog user={user} onRoomCreated={handleRoomCreated} />
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">الغرف المتاحة</Button>
                    <Button variant="outline" size="icon"><Search className="h-4 w-4" /></Button>
                </div>
            </header>
            <div className="flex-1 p-4 text-right">
                <h2 className="text-xl font-bold mb-4">غرفي</h2>
                {myRooms.length === 0 ? (
                    <p className="text-muted-foreground">لم تقم بإنشاء أي غرف بعد.</p>
                ) : (
                    <div className="grid gap-3">
                        {myRooms.map(room => (
                            <div key={room.id} className="relative group">
                                <button onClick={() => onEnterRoom(room)} className="w-full text-right p-0.5 bg-gradient-to-b from-yellow-300 to-yellow-500 rounded-2xl shadow-lg">
                                    <div className="bg-gradient-to-b from-yellow-50 via-amber-50 to-yellow-100 rounded-[14px] p-3 flex items-center justify-between gap-3">
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="font-bold text-lg text-gray-800">{room.name}</h3>
                                                    <p className="text-sm text-gray-500 mt-1">مرحبا بكم في غرفة {room.name}</p>
                                                </div>
                                                <div className="bg-amber-400 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                                                    <span>{Math.floor(Math.random() * 500) + 10}</span>
                                                    <svg width="12" height="10" viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11 0H9.33333V10H11V0Z" fill="white"/><path d="M7.33333 3.33333H5.66667V10H7.33333V3.33333Z" fill="white"/><path d="M3.66667 6.66667H2V10H3.66667V6.66667Z" fill="white"/></svg>
                                                </div>
                                            </div>
                                            <div className="mt-4 flex items-center gap-2">
                                                <div className="bg-purple-800 text-white text-xs font-bold px-1.5 py-0.5 rounded-sm">ID</div>
                                                <span className="text-gray-600 font-semibold">{room.id}</span>
                                            </div>
                                        </div>
                                        <div className="w-20 h-20 rounded-lg p-0.5 bg-gradient-to-b from-yellow-400 to-yellow-600">
                                            <Avatar className="w-full h-full rounded-md">
                                                <AvatarImage src={room.image} alt={room.name} />
                                                <AvatarFallback>{room.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                        </div>
                                    </div>
                                </button>
                                 <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="icon" className="absolute top-2 left-2 w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                سيتم حذف هذه الغرفة بشكل دائم. لا يمكن التراجع عن هذا الإجراء.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDeleteRoom(room.id)}>حذف</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function EditRoomDialog({ room, onRoomUpdated, children }: { room: Room, onRoomUpdated: (updatedRoom: Room) => void, children: React.ReactNode }) {
    const [roomName, setRoomName] = useState(room.name);
    const [roomImage, setRoomImage] = useState<string>(room.image);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => setRoomImage(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSaveChanges = () => {
        const updatedRoom = { ...room, name: roomName, image: roomImage };
        
        // Update localStorage
        const existingRooms: Room[] = JSON.parse(localStorage.getItem('userRooms') || '[]');
        const roomIndex = existingRooms.findIndex(r => r.id === updatedRoom.id);
        if (roomIndex !== -1) {
            existingRooms[roomIndex] = updatedRoom;
            localStorage.setItem('userRooms', JSON.stringify(existingRooms));
        }
        
        onRoomUpdated(updatedRoom);
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
                         <Avatar className="w-24 h-24 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            <AvatarImage src={roomImage} />
                            <AvatarFallback><Camera className="w-8 h-8" /></AvatarFallback>
                        </Avatar>
                        <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
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

const FallingSparkles = () => {
    const items = Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      animationDuration: `${Math.random() * 2 + 3}s`,
      animationDelay: `${Math.random() * 3}s`,
      fontSize: `${Math.random() * 1 + 0.5}rem`,
      opacity: Math.random() * 0.5 + 0.5,
    }));
  
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {items.map(item => (
          <motion.div
            key={item.id}
            className="absolute -top-10 text-yellow-300"
            style={{ left: item.left, fontSize: item.fontSize, opacity: item.opacity }}
            animate={{ top: '110%', rotate: 360 }}
            transition={{
              duration: parseFloat(item.animationDuration),
              delay: parseFloat(item.animationDelay),
              repeat: Infinity,
              ease: 'linear',
            }}
          >
            ✨
          </motion.div>
        ))}
      </div>
    );
};

function GiftAnimationOverlay({ sender, receiver, gift, onEnd }: { sender: UserProfile, receiver: UserProfile, gift: GiftItem, onEnd: () => void }) {
    useEffect(() => {
        const timer = setTimeout(onEnd, 4000); // Animation lasts for 4 seconds
        return () => clearTimeout(timer);
    }, [onEnd]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-4"
        >
            <FallingSparkles />
            <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', damping: 10, stiffness: 100, delay: 0.2 }}
                className="text-center text-white"
            >
                <p className="text-xl font-bold">{sender.name} أهدى {receiver.name}</p>
                <h2 className="text-4xl font-extrabold text-yellow-300 my-4">{gift.name}</h2>
            </motion.div>
            <motion.div
                 initial={{ y: "150%", opacity: 0, scale: 0.5 }}
                 animate={{ y: 0, opacity: 1, scale: 1 }}
                 transition={{ type: 'spring', damping: 15, stiffness: 80, delay: 0.5 }}
                 className="my-8"
            >
                <img src={gift.image} data-ai-hint="lion gold" alt={gift.name} className="w-48 h-48 md:w-64 md:h-64 object-contain drop-shadow-[0_0_25px_rgba(255,215,0,0.7)]" />
            </motion.div>
             <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="text-2xl font-bold text-yellow-400"
            >
                +{gift.price.toLocaleString()}
            </motion.p>
        </motion.div>
    )
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
    onSendGift: (gift: GiftItem, recipient: UserProfile) => void,
    balance: number,
    initialRecipient: UserProfile | null,
}) {
    const [selectedRecipient, setSelectedRecipient] = useState<UserProfile | null>(null);

    // This effect runs when the dialog is opened or the initialRecipient changes.
    // It sets the initial recipient if one is provided.
    useEffect(() => {
        if (isOpen) {
            setSelectedRecipient(initialRecipient);
        }
    }, [initialRecipient, isOpen]);

    // This effect resets the selected recipient when the dialog is closed.
    useEffect(() => {
        if (!isOpen) {
            setSelectedRecipient(null);
        }
    }, [isOpen]);

    const handleSendClick = (gift: GiftItem) => {
        if (selectedRecipient) {
            onSendGift(gift, selectedRecipient);
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
                                <div className="flex justify-between items-center w-full mt-4 p-2 bg-black/30 rounded-lg">
                                     <Button size="lg" onClick={() => handleSendClick(gift)}>إرسال</Button>
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

function RoomScreen({ room, user, onExit, onRoomUpdated }: { room: Room, user: UserProfile, onExit: () => void, onRoomUpdated: (updatedRoom: Room) => void }) {
     const { toast } = useToast();
     const [micSlots, setMicSlots] = useState<MicSlot[]>(
        Array(10).fill(null).map((_, i) => i === 0 ? { user: BOT_USER, isMuted: true, isLocked: false } : { user: null, isMuted: false, isLocked: false })
     );
     const [isSpeaking, setIsSpeaking] = useState(isSpeaking);
     const [isGameVisible, setIsGameVisible] = useState(false);
     
     const myMicIndex = micSlots.findIndex(slot => slot.user?.userId === user.userId);
     const isOwner = user.userId === room.ownerId;
     
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState("");
    const chatContainerRef = useRef<HTMLDivElement>(null);

    const [balance, setBalance] = useState(10000000);
    const [isGiftDialogOpen, setIsGiftDialogOpen] = useState(false);
    const [initialRecipientForGift, setInitialRecipientForGift] = useState<UserProfile | null>(null);
    const [activeGiftAnimation, setActiveGiftAnimation] = useState<{ sender: UserProfile, receiver: UserProfile, gift: GiftItem } | null>(null);

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

    const handleSendGift = (gift: GiftItem, recipient: UserProfile) => {
        if (balance < gift.price) {
            toast({ variant: "destructive", title: "رصيد غير كافٍ!", description: "ليس لديك ما يكفي من العملات لإرسال هذه الهدية." });
            return;
        }

        setBalance(prev => prev - gift.price);
        setActiveGiftAnimation({ sender: user, receiver: recipient, gift });
        
        // Update room supporters state
        setRoomSupporters(prev => {
            const existingSupporterIndex = prev.findIndex(s => s.user.userId === user.userId);
            let newSupporters = [...prev];
            if (existingSupporterIndex !== -1) {
                const updatedSupporter = { ...newSupporters[existingSupporterIndex] };
                updatedSupporter.totalGiftValue += gift.price;
                newSupporters[existingSupporterIndex] = updatedSupporter;
            } else {
                newSupporters.push({ user, totalGiftValue: gift.price });
            }
            // Sort by total gift value descending and return
            return newSupporters.sort((a, b) => b.totalGiftValue - a.totalGiftValue);
        });

        toast({ title: "تم إرسال الهدية!", description: `لقد أرسلت ${gift.name} إلى ${recipient.name}.` });
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
            <header className="flex items-start justify-between p-3">
               <div className="flex items-center gap-2">
                   <Popover>
                       <PopoverTrigger asChild>
                           <Button variant="ghost" size="icon" className="bg-black/20 rounded-full">
                               <Power className="w-5 h-5 text-primary" />
                           </Button>
                       </PopoverTrigger>
                       <PopoverContent className="w-auto">
                          <Button variant="destructive" onClick={onExit}>الخروج من الغرفة</Button>
                       </PopoverContent>
                   </Popover>
               </div>
               {isOwner ? (
                   <EditRoomDialog room={room} onRoomUpdated={onRoomUpdated}>
                       {roomInfoContent}
                   </EditRoomDialog>
               ) : (
                   roomInfoContent
               )}
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
                <AnimatePresence>
                    {activeGiftAnimation && (
                        <GiftAnimationOverlay
                            sender={activeGiftAnimation.sender}
                            receiver={activeGiftAnimation.receiver}
                            gift={activeGiftAnimation.gift}
                            onEnd={() => setActiveGiftAnimation(null)}
                        />
                    )}
                </AnimatePresence>
                
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
                        <div className="flex items-center gap-2">
                           <div className="w-8 h-8 rounded-full bg-primary/30 flex items-center justify-center border border-primary text-sm font-bold">1</div>
                           <div className="flex -space-x-4 rtl:space-x-reverse">
                               <Avatar className="w-8 h-8 border-2 border-background">
                                   <AvatarImage src="https://placehold.co/100x100.png" />
                                   <AvatarFallback>A</AvatarFallback>
                               </Avatar>
                           </div>
                        </div>
                        <Popover>
                            <PopoverTrigger asChild>
                                <button className="flex items-center gap-2 p-1 px-3 rounded-full bg-red-800/50 border border-red-500 cursor-pointer">
                                    <span className="font-bold text-sm">{formatNumber(totalRoomSupport)}</span>
                                    <Trophy className="w-5 h-5 text-yellow-400"/>
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
                    
                    <div className="grid grid-cols-5 gap-y-4 gap-x-4 p-4">
                        {micSlots.slice(0, 5).map((slot, index) => <RoomMic key={index} slot={slot} index={index} />)}
                        {micSlots.slice(5, 10).map((slot, index) => <RoomMic key={index+5} slot={slot} index={index+5} />)}
                    </div>
                </div>

                <AnimatePresence>
                    {isGameVisible && (
                        <motion.div 
                            className="absolute inset-x-0 bottom-0 top-1/4 bg-background z-20 rounded-t-2xl overflow-hidden"
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        >
                           <div className="relative h-full w-full">
                               <FruityFortuneGame />
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

// --- NEW PROFILE SCREEN ---

function NewProfileScreen() {
    const { toast } = useToast();

    const handleCoinsClick = () => {
        toast({
            title: "قريباً",
            description: "هذه الميزة قيد التطوير.",
        });
    };

    return (
        <div className="flex items-center justify-center h-full bg-background">
            <div className="relative w-full max-w-sm">
                <img src="https://i.imgur.com/hj1YrcL.jpg" alt="Profile Page" className="w-full h-auto" />
                <button
                    onClick={handleCoinsClick}
                    className="absolute cursor-pointer"
                    style={{
                        top: '11.5%',
                        right: '5%',
                        width: '27%',
                        height: '5%',
                        backgroundColor: 'rgba(255, 0, 0, 0)',
                    }}
                    aria-label="Coins"
                ></button>
            </div>
        </div>
    );
}


function MainApp({ user, onReset, onUserUpdate }: { user: UserProfile, onReset: () => void, onUserUpdate: (updatedUser: UserProfile) => void }) {
    const [view, setView] = useState<'list' | 'in_room'>('list');
    const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
    const [activeTab, setActiveTab] = useState<'rooms' | 'profile'>('rooms');
    const { toast } = useToast();

    const handleEnterRoom = (room: Room) => {
        setCurrentRoom(room);
        setView('in_room');
    };

    const handleExitRoom = () => {
        setCurrentRoom(null);
        setView('list');
    };

    const handleRoomUpdated = (updatedRoom: Room) => {
        setCurrentRoom(updatedRoom);
    };

    if (view === 'in_room' && currentRoom) {
        return <RoomScreen room={currentRoom} user={user} onExit={handleExitRoom} onRoomUpdated={handleRoomUpdated} />;
    }

    return (
        <div className="flex flex-col h-screen">
            <main className="flex-1 overflow-y-auto bg-background">
                 {activeTab === 'rooms' && <RoomsListScreen user={user} onEnterRoom={handleEnterRoom} onRoomUpdated={handleRoomUpdated} />}
                 {activeTab === 'profile' && <NewProfileScreen />}
            </main>
            <footer className="flex justify-around items-center p-2 border-t border-border bg-background/80 backdrop-blur-sm sticky bottom-0">
                 <button 
                    onClick={() => setActiveTab('rooms')}
                    className={cn(
                        "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors",
                        activeTab === 'rooms' ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    )}>
                    <MessageSquare className="w-6 h-6" />
                    <span className="text-xs font-medium">الغرف</span>
                </button>
                 <button 
                    onClick={() => {
                        // In a real app, you would navigate to the game page.
                        // For this example, we'll just show a toast.
                        toast({ title: "اللعبة موجودة داخل الغرف" });
                    }}
                    className={cn(
                        "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors text-muted-foreground cursor-pointer",
                        "hover:text-foreground"
                    )}>
                    <Gamepad2 className="w-6 h-6" />
                    <span className="text-xs font-medium">اللعبة</span>
                </button>
                <button 
                     onClick={() => setActiveTab('profile')}
                    className={cn(
                        "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors",
                         activeTab === 'profile' ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    )}>
                    <img src="https://i.imgur.com/EWnIx50.jpg" alt="Profile" className="w-6 h-6" />
                    <span className="text-xs font-medium">أنا</span>
                </button>
            </footer>
        </div>
    );
}


// --- Root Component & Profile Gate ---
export default function HomePage() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [nameInput, setNameInput] = useState("");
  const [imageInput, setImageInput] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    try {
        const savedUser = localStorage.getItem("userProfile");
        if (savedUser) {
          setUserProfile(JSON.parse(savedUser));
        }
    } catch (error) {
        console.error("Failed to parse user profile from localStorage", error);
        localStorage.removeItem("userProfile");
    }
    setIsLoading(false);
  }, []);
  
  const handleUserUpdate = (updatedUser: UserProfile) => {
        localStorage.setItem("userProfile", JSON.stringify(updatedUser));
        setUserProfile(updatedUser);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageInput(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (nameInput && imageInput) {
      const userId = localStorage.getItem("userId") || Math.floor(100000 + Math.random() * 900000).toString();
      
      const newUserProfile: UserProfile = { name: nameInput, image: imageInput, userId: userId };

      localStorage.setItem("userProfile", JSON.stringify(newUserProfile));
      localStorage.setItem("userId", userId); // Also save userId separately if needed elsewhere
      
      setUserProfile(newUserProfile);

      toast({
          title: "تم حفظ الملف الشخصي",
          description: "مرحبًا بك في التطبيق!",
      });
    } else {
       toast({
          variant: "destructive",
          title: "بيانات غير مكتملة",
          description: "يرجى إدخال الاسم واختيار صورة.",
      });
    }
  };
  
  const handleReset = () => {
    setUserProfile(null); 
    localStorage.removeItem("userProfile");
    localStorage.removeItem("userRooms");
    setNameInput("");
    setImageInput(null);
    toast({ title: "تم تسجيل الخروج" });
  }
  
  if (isLoading) {
      return (
          <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
          </div>
      )
  }

  if (userProfile) {
    return <MainApp user={userProfile} onReset={handleReset} onUserUpdate={handleUserUpdate} />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">إنشاء ملفك الشخصي</CardTitle>
          <CardDescription className="text-center">
            أدخل اسمك واختر صورة للبدء
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6">
          <div className="relative">
            <Avatar className="w-32 h-32 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <AvatarImage src={imageInput || ''} />
              <AvatarFallback className="text-4xl">
                <Camera className="w-12 h-12" />
              </AvatarFallback>
            </Avatar>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              className="hidden"
              accept="image/*"
            />
          </div>
          
          <Input
            type="text"
            placeholder="أدخل اسمك..."
            value={nameInput || ''}
            onChange={(e) => setNameInput(e.target.value)}
            className="text-center text-lg"
          />

          <Button onClick={handleSave} className="w-full" size="lg">
            حفظ ومتابعة
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

    