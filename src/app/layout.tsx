
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/components/providers/auth-provider';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';
import FirebaseMessagingProvider from '@/components/providers/firebase-messaging-provider';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'VoxaLo Connect',
  description: 'A 1-to-1 chat application.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full ${inter.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased h-full">
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
        >
            <AuthProvider>
              <FirebaseMessagingProvider>
                {children}
              </FirebaseMessagingProvider>
            </AuthProvider>
            <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
