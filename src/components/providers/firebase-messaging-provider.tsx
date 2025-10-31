
'use client';

import { useEffect, useState } from 'react';
import { onMessage } from 'firebase/messaging';
import { onMessageListener } from '@/lib/firebase-messaging';
import { useToast } from '@/hooks/use-toast';
import type { MessagePayload } from 'firebase/messaging';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { getDoc, doc, onSnapshot } from 'firebase/firestore';

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
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && user) {
        onMessageListener()
            .then((payload) => {
                 if (payload && (payload as MessagePayload).notification) {
                    const { title, body } = (payload as MessagePayload).notification!;
                    const chatId = (payload as MessagePayload).data?.chatId;
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

                    if (notificationSoundEnabled) {
                        const audio = new Audio('/notification.mp3');
                        audio.play().catch(e => console.error("Error playing notification sound:", e));
                    }
                }
            })
            .catch(err => console.error('failed: ', err));
    }
  }, [toast, router, pathname, searchParams, user, notificationSoundEnabled]);


  return <>{children}</>;
}
