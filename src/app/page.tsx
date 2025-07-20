"use client";

import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Chrome } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = () => {
    // In a real app, this would involve a Firebase popup, etc.
    // We'll simulate a successful login and redirect.
    localStorage.setItem('isLoggedIn', 'true');
    router.push('/profile');
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-900/50" style={{
      backgroundImage: 'url(https://placehold.co/1920x1080/0a0a0a/444444?text=.)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }} data-ai-hint="space stars">
      <Card className="w-full max-w-md bg-card/80 backdrop-blur-sm animate-slide-in">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold tracking-tight text-primary">
            Welcome to the Chat Room
          </CardTitle>
          <CardDescription>
            Sign in to join the conversation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" onClick={handleLogin}>
            <Chrome className="mr-2 h-5 w-5" />
            Sign in with Google
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
