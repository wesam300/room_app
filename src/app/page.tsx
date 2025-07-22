
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Camera, User, Gamepad2, MessageSquare, Copy, ChevronLeft, Search, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

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

// --- TopBar Component ---
function TopBar({ name, image, userId, onBack }: { name: string | null, image: string | null, userId: string | null, onBack: () => void }) {
    const { toast } = useToast();

    const handleCopyId = () => {
        if (userId) {
            navigator.clipboard.writeText(userId);
            toast({
                title: "تم نسخ الـ ID",
                description: "تم نسخ هوية المستخدم إلى الحافظة.",
            });
        }
    };

    return (
        <header className="flex items-center justify-between p-3 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10">
            <Button variant="ghost" size="icon" onClick={onBack}>
                <ChevronLeft className="w-6 h-6" />
            </Button>
            <div className="flex items-center gap-3">
                 <div className="text-right">
                    <p className="font-bold text-lg">{name}</p>
                    {userId && (
                        <div className="flex items-center justify-end gap-1.5">
                             <button onClick={handleCopyId} className="text-muted-foreground hover:text-foreground">
                                <Copy className="h-3 w-3" />
                            </button>
                            <span className="text-sm text-muted-foreground">{userId}</span>
                        </div>
                    )}
                </div>
                <Avatar className="w-12 h-12">
                    <AvatarImage src={image || ''} alt={name || ''} />
                    <AvatarFallback>{name ? name.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
                </Avatar>
            </div>
        </header>
    );
}

// --- ProfileScreen Component ---
function ProfileScreen({ onReset }: { onReset: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center flex-1 p-4 text-center">
             <p className="text-muted-foreground mb-6">
               مرحبًا بك! يمكنك إدارة حسابك من هنا.
            </p>
            <Button onClick={onReset} variant="link">إعادة تعيين الملف الشخصي</Button>
        </div>
    );
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
            id: `room_${Math.random().toString(36).substr(2, 9)}`,
            name: roomName,
            image: roomImage,
            ownerId: user.userId,
        };

        // Save to localStorage (or could be an API call)
        const existingRooms: Room[] = JSON.parse(localStorage.getItem('userRooms') || '[]');
        localStorage.setItem('userRooms', JSON.stringify([...existingRooms, newRoom]));
        
        toast({ title: "تم إنشاء الغرفة بنجاح!" });
        onRoomCreated(newRoom);
        setIsOpen(false); // Close dialog
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

function RoomsListScreen({ user, onEnterRoom }: { user: UserProfile, onEnterRoom: (room: Room) => void }) {
    // In a real app, you'd fetch public rooms or user's rooms
    const myRooms = JSON.parse(localStorage.getItem('userRooms') || '[]') as Room[];

    return (
        <div className="flex flex-col h-full">
            <header className="flex items-center justify-between p-2 border-b">
                <CreateRoomDialog user={user} onRoomCreated={onEnterRoom} />
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">الغرف المتاحة</Button>
                    <Button variant="outline" size="icon"><Search className="h-4 w-4" /></Button>
                </div>
            </header>
            <div className="flex-1 p-4 text-center">
                <h2 className="text-xl font-bold mb-4">غرفي</h2>
                {myRooms.length === 0 ? (
                    <p className="text-muted-foreground">لم تقم بإنشاء أي غرف بعد.</p>
                ) : (
                    <div className="grid gap-4">
                        {myRooms.map(room => (
                             <button key={room.id} onClick={() => onEnterRoom(room)} className="w-full text-right p-3 bg-muted rounded-lg flex items-center gap-3">
                                 <Avatar>
                                     <AvatarImage src={room.image} alt={room.name} />
                                     <AvatarFallback>{room.name.charAt(0)}</AvatarFallback>
                                 </Avatar>
                                 <span>{room.name}</span>
                             </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function RoomScreen({ room, onExit }: { room: Room, onExit: () => void }) {
     const { toast } = useToast();

     const handleCopyId = () => {
        navigator.clipboard.writeText(room.id);
        toast({ title: "تم نسخ ID الغرفة" });
    };

    return (
         <div className="flex flex-col h-full">
            <header className="flex items-center justify-between p-3 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10">
                <Button variant="ghost" size="icon" onClick={onExit}>
                    <ChevronLeft className="w-6 h-6" />
                </Button>
                <div className="flex items-center gap-3">
                     <div className="text-right">
                        <p className="font-bold text-lg">{room.name}</p>
                         <div className="flex items-center justify-end gap-1.5">
                             <button onClick={handleCopyId} className="text-muted-foreground hover:text-foreground">
                                <Copy className="h-3 w-3" />
                            </button>
                            <span className="text-sm text-muted-foreground">{room.id}</span>
                        </div>
                    </div>
                    <Avatar className="w-12 h-12">
                        <AvatarImage src={room.image} alt={room.name} />
                        <AvatarFallback>{room.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                </div>
            </header>
            <main className="flex-1 p-4">
                {/* Room content goes here */}
                 <h1 className="text-center text-2xl text-muted-foreground">محتوى الغرفة سيكون هنا</h1>
            </main>
        </div>
    );
}


// --- Main App Shell ---
function MainApp({ user, onReset }: { user: UserProfile, onReset: () => void }) {
    const [activeTab, setActiveTab] = useState('rooms');
    // 'list' | 'in_room'
    const [roomView, setRoomView] = useState<'list' | 'in_room'>('list');
    const [currentRoom, setCurrentRoom] = useState<Room | null>(null);

    const handleEnterRoom = (room: Room) => {
        setCurrentRoom(room);
        setRoomView('in_room');
    };

    const handleExitRoom = () => {
        setCurrentRoom(null);
        setRoomView('list');
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'profile':
                return <ProfileScreen onReset={() => setActiveTab('profile_edit')} />;
            case 'rooms':
                if (roomView === 'in_room' && currentRoom) {
                    return <RoomScreen room={currentRoom} onExit={handleExitRoom} />;
                }
                return <RoomsListScreen user={user} onEnterRoom={handleEnterRoom} />;
            default:
                return <div className="flex-1 p-4"></div>;
        }
    }

    return (
        <div className="flex flex-col h-screen">
            {activeTab === 'profile' && (
                <TopBar name={user.name} image={user.image} userId={user.userId} onBack={onReset} />
            )}
            <main className="flex-1 overflow-y-auto bg-background">
                {renderContent()}
            </main>
            <footer className="flex justify-around items-center p-2 border-t border-border bg-background/80 backdrop-blur-sm sticky bottom-0">
                 <button 
                    onClick={() => setActiveTab('rooms')} 
                    className={cn(
                        "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors text-muted-foreground",
                        activeTab === 'rooms' ? "text-primary" : "hover:text-foreground"
                    )}>
                    <MessageSquare className="w-6 h-6" />
                    <span className="text-xs font-medium">الغرف</span>
                </button>
                 <Link href="/project-885" passHref>
                    <div className={cn(
                        "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors text-muted-foreground",
                        "hover:text-foreground"
                    )}>
                        <Gamepad2 className="w-6 h-6" />
                        <span className="text-xs font-medium">اللعبة</span>
                    </div>
                </Link>
                <button 
                    onClick={() => setActiveTab('profile')} 
                    className={cn(
                        "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors text-muted-foreground",
                        activeTab === 'profile' ? "text-primary" : "hover:text-foreground"
                    )}>
                    <User className="w-6 h-6" />
                </button>
            </footer>
        </div>
    );
}


// --- Root Component & Profile Gate ---
export default function HomePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // States for profile creation
  const [name, setName] = useState<string | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Load profile from localStorage on initial mount
  useEffect(() => {
    const savedName = localStorage.getItem("userName");
    const savedImage = localStorage.getItem("userImage");
    const savedUserId = localStorage.getItem("userId");
    if (savedName && savedImage && savedUserId) {
      setUser({ name: savedName, image: savedImage, userId: savedUserId });
    }
    setIsLoading(false);
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (name && image) {
      let currentUserId = localStorage.getItem("userId");
      if (!currentUserId) {
          currentUserId = Math.floor(100000 + Math.random() * 900000).toString();
          localStorage.setItem("userId", currentUserId);
      }
      localStorage.setItem("userName", name);
      localStorage.setItem("userImage", image);
      
      setUser({ name, image, userId: currentUserId });

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
    // Clear user state to show creation screen
    setUser(null); 
    // also clear localStorage if you want it to be permanent
    localStorage.removeItem("userName");
    localStorage.removeItem("userImage");
    localStorage.removeItem("userId");
    setName(null);
    setImage(null);
  }
  
  if (isLoading) {
      return (
          <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
              {/* Optional: Add a spinner here */}
          </div>
      )
  }

  if (user) {
    return <MainApp user={user} onReset={handleReset} />;
  }

  // --- Profile Creation Screen ---
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
              <AvatarImage src={image || ''} />
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
            value={name || ''}
            onChange={(e) => setName(e.target.value)}
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

