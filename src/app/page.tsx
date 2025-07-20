"use client";

import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Chrome } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = () => {
    localStorage.setItem('isLoggedIn', 'true');
    router.push('/profile');
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gradient-to-b from-[#2a1a08] to-[#4e3415]">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] opacity-5"></div>
      <Card className="w-full max-w-md bg-card/80 backdrop-blur-sm animate-slide-in border-yellow-600/50">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold tracking-tight text-primary">
            Welcome to the Room
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Sign in to join the conversation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full bg-primary/80 hover:bg-primary text-primary-foreground" onClick={handleLogin}>
            <Chrome className="mr-2 h-5 w-5" />
            Sign in with Google
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
