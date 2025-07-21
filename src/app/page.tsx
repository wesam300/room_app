
"use client";

import { AllFruitsDisplay } from '@/components/fruits';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white p-4">
      <h1 className="text-4xl font-bold mb-8">لعبة الفواكه</h1>
      
      <div className="w-full max-w-md">
        <AllFruitsDisplay />
      </div>

      <div className="mt-8 text-lg">
        مكونات اللعبة الأخرى ستضاف هنا
      </div>
    </main>
  );
}
