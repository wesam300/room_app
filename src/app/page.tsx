"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Camera, User, Gamepad2, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";


function ProfileScreen({ name, image, onReset }: { name: string | null, image: string | null, onReset: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center flex-1 p-4">
            <Card className="w-full max-w-md text-center p-6">
                <CardHeader>
                    <div className="flex justify-center mb-4">
                        <Avatar className="w-24 h-24">
                            <AvatarImage src={image || ''} alt={name || ''} />
                            <AvatarFallback>{name ? name.charAt(0) : 'U'}</AvatarFallback>
                        </Avatar>
                    </div>
                    <CardTitle className="text-2xl">مرحباً بك يا {name}!</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground mb-6">
                        أنت الآن جاهز للانطلاق في مشاريعك.
                    </p>
                    <Button onClick={onReset} variant="link">إعادة تعيين الملف الشخصي</Button>
                </CardContent>
            </Card>
        </div>
    );
}

function MainApp({ name, image, onReset }: { name: string | null, image: string | null, onReset: () => void }) {
    const [activeTab, setActiveTab] = useState('rooms');

    const renderContent = () => {
        switch (activeTab) {
            case 'profile':
                return <ProfileScreen name={name} image={image} onReset={onReset} />;
            case 'rooms':
                return <div className="flex-1 p-4"><h1 className="text-center text-2xl">الغرف</h1></div>;
            default:
                return <div className="flex-1 p-4"></div>;
        }
    }

    return (
        <div className="flex flex-col h-screen" dir="rtl">
            <main className="flex-1 overflow-y-auto">
                {renderContent()}
            </main>
            <footer className="flex justify-around items-center p-2 border-t border-border bg-background/80 backdrop-blur-sm sticky bottom-0">
                <button 
                    onClick={() => setActiveTab('profile')} 
                    className={cn(
                        "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors text-muted-foreground",
                        activeTab === 'profile' ? "text-primary" : "hover:text-foreground"
                    )}>
                    <User className="w-6 h-6" />
                    <span className="text-xs font-medium">أنا</span>
                </button>
                 <Link href="/project-885" passHref>
                    <div className={cn(
                        "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors text-muted-foreground",
                        activeTab === 'game' ? "text-primary" : "hover:text-foreground"
                    )}>
                        <Gamepad2 className="w-6 h-6" />
                        <span className="text-xs font-medium">اللعبة</span>
                    </div>
                </Link>
                <button 
                    onClick={() => setActiveTab('rooms')} 
                    className={cn(
                        "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors text-muted-foreground",
                        activeTab === 'rooms' ? "text-primary" : "hover:text-foreground"
                    )}>
                    <MessageSquare className="w-6 h-6" />
                    <span className="text-xs font-medium">الغرف</span>
                </button>
            </footer>
        </div>
    );
}


export default function HomePage() {
  const [name, setName] = useState<string | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [isProfileSet, setIsProfileSet] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load profile from localStorage on initial mount
  useEffect(() => {
    const savedName = localStorage.getItem("userName");
    const savedImage = localStorage.getItem("userImage");
    if (savedName && savedImage) {
      setName(savedName);
      setImage(savedImage);
      setIsProfileSet(true);
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
      localStorage.setItem("userName", name);
      localStorage.setItem("userImage", image);
      setIsProfileSet(true);
    } else {
      alert("يرجى إدخال الاسم واختيار صورة.");
    }
  };
  
  const handleReset = () => {
    localStorage.removeItem("userName");
    localStorage.removeItem("userImage");
    setName("");
    setImage(null);
    setIsProfileSet(false);
  }
  
  if (isLoading) {
      return (
          <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
              {/* Optional: Add a spinner here */}
          </div>
      )
  }

  if (isProfileSet) {
    return <MainApp name={name} image={image} onReset={handleReset} />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4" dir="rtl">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">إنشاء ملفك الشخصي</CardTitle>
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
