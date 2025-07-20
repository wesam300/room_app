import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-center">Ready for Your New Game Idea</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">
            Please describe the new game you'd like to build. I'm ready to start fresh and build it right.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
