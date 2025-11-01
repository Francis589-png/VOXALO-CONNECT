'use client';

import { useEffect, useState } from 'react';
import { onMessage, type MessagePayload } from 'firebase/messaging';
import { messaging } from '@/lib/firebase-messaging';
import { useToast } from '@/hooks/use-toast';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export default function FirebaseMessagingProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [notificationSoundEnabled, setNotificationSoundEnabled] = useState(false);


  useEffect(() => {
    if (user?.uid) {
        const userDocRef = doc(db, 'users', user.uid);
        const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                setNotificationSoundEnabled(docSnap.data().notificationSounds ?? false);
            }
        });
        return () => unsubscribe();
    }
  }, [user?.uid])

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && user && messaging) {
        
        const unsubscribe = onMessage(messaging, (payload: MessagePayload) => {
            console.log('Foreground message received.', payload);
            if (payload && payload.data) {
                const { title, body, chatId } = payload.data;
                const currentChatId = searchParams.get('chatId');

                // Don't show notification if user is already in the chat and window is focused
                if (pathname === '/' && chatId === currentChatId && document.hasFocus()) {
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

                if (notificationSoundEnabled) {
                    const audio = new Audio('/notification.mp3');
                    audio.play().catch(e => console.error("Error playing notification sound:", e));
                }
            }
        });

        return () => {
            unsubscribe();
        };
    }
  }, [toast, router, pathname, searchParams, user, notificationSoundEnabled]);


  return <>{children}</>;
}
