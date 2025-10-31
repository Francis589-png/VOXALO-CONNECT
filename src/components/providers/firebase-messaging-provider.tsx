
'use client';

import { useEffect, useState } from 'react';
import { onMessageListener } from '@/lib/firebase-messaging';
import { useToast } from '@/hooks/use-toast';
import type { MessagePayload } from 'firebase/messaging';
import { useRouter } from 'next/navigation';

export default function FirebaseMessagingProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const handleMessage = async () => {
      try {
        const payload = await onMessageListener() as MessagePayload;
        if (payload.notification) {
          const { title, body, icon } = payload.notification;
          const chatId = payload.data?.chatId;

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
          
           if (payload.data?.soundEnabled === 'true') {
             const audio = new Audio('/notification.mp3');
             audio.play().catch(e => console.error("Error playing notification sound:", e));
           }
        }
      } catch (error) {
        console.error('Error handling foreground message:', error);
      }
    };
    
    handleMessage();
  }, [toast, router]);

  return <>{children}</>;
}
