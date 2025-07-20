import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { Poppins } from 'next/font/google'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600', '700']
})

export const metadata: Metadata = {
  title: 'Fruit Casino Game',
  description: 'A fun betting game with fruits!',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${poppins.className} antialiased bg-background`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
