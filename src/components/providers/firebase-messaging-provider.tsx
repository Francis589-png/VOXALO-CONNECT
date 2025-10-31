
'use client';

import { useEffect } from 'react';
import { onMessageListener } from '@/lib/firebase-messaging';
import { useToast } from '@/hooks/use-toast';
import type { MessagePayload } from 'firebase/messaging';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

export default function FirebaseMessagingProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        const unsubscribe = onMessage(onMessageListener(), (payload: MessagePayload) => {
            if (payload.notification) {
                const { title, body } = payload.notification;
                const chatId = payload.data?.chatId;
                const currentChatId = searchParams.get('chatId');

                // Don't show notification if user is already in the chat
                if (pathname === '/' && chatId === currentChatId) {
                    return;
                }

                toast({
                    title: title,
                    description: body,
                    action: chatId ? (
                    <button
                        onClick={() => router.push(`/?chatId=${chatId}`)}
                        className="text-sm font-medium text-primary hover:underline"
                    >
                        Open
                    </button>
                    ) : undefined,
                });

                if (payload.data?.soundEnabled === 'true' && user) {
                     // We need to fetch the user's latest setting from the DB
                     const playSound = async () => {
                        const userDoc = await (await import('firebase/firestore')).getDoc((await import('firebase/firestore')).doc(db, 'users', user.uid));
                        if(userDoc.exists() && userDoc.data().notificationSounds) {
                            const audio = new Audio('/notification.mp3');
                            audio.play().catch(e => console.error("Error playing notification sound:", e));
                        }
                     }
                     playSound();
                }
            }
        });

        return () => unsubscribe();
    }
  }, [toast, router, pathname, searchParams, user]);


  return <>{children}</>;
}
