"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">مرحباً بك في صفحة المشاريع</h1>
        <p className="text-lg text-muted-foreground mb-8">
          هذه هي نقطة البداية لمشاريعنا الجديدة. يمكنك استخدام هذه المساحة لبناء أي فكرة لديك.
        </p>
        <Link href="/project-885">
          <Button size="lg">
            فتح مشروع 885 (لعبة الفواكه)
          </Button>
        </Link>
      </div>
    </div>
  );
}
