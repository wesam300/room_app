import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-6xl">
          Ready for a new idea!
        </h1>
        <p className="mt-6 text-lg leading-8 text-foreground">
          Let's build something great together.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Button>Get Started</Button>
        </div>
      </div>
    </main>
  );
}
