import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { Tajawal } from 'next/font/google'

const tajawal = Tajawal({
  subsets: ['arabic'],
  weight: ['400', '700']
})

export const metadata: Metadata = {
  title: 'Fruit Casino Game',
  description: 'An exciting fruit casino game.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <head>
          <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700&display=swap" />
      </head>
      <body className={`${tajawal.className} antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
