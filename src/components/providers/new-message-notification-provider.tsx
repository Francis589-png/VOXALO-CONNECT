
'use client';
import { createContext, useContext, useCallback, ReactNode, useState, useEffect } from 'react';
import type { User, Message } from '@/types';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface NewMessageNotificationContextType {
  showNotification: (sender: User, message: Message) => void;
}

const NewMessageNotificationContext = createContext<NewMessageNotificationContextType | undefined>(undefined);

export function NewMessageNotificationProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    setAudio(new Audio('/notification.mp3'));
  }, []);

  useEffect(() => {
    if (user?.uid) {
      const userDocRef = doc(db, 'users', user.uid);
      getDoc(userDocRef).then((docSnap) => {
        if (docSnap.exists() && docSnap.data().notificationSounds) {
          setSoundEnabled(true);
        } else {
          setSoundEnabled(false);
        }
      });
    }
  }, [user]);


  const getMessagePreview = (message: Message) => {
    switch (message.type) {
      case 'image':
        return 'Sent an image';
      case 'file':
        return `Sent a file: ${message.fileName || 'attachment'}`;
      default:
        return message.text;
    }
  }

  const showNotification = useCallback((sender: User, message: Message) => {
    if (soundEnabled && audio) {
        audio.play().catch(error => {
          console.error("Failed to play notification sound:", error);
        });
    }

    toast({
      description: (
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={sender.photoURL || undefined} alt={sender.displayName || 'Sender'} />
            <AvatarFallback>{sender.displayName?.[0]}</AvatarFallback>
          </Avatar>
          <div className='flex-1'>
            <p className="font-bold">{sender.displayName}</p>
            <p className="text-sm text-muted-foreground break-words">
              {getMessagePreview(message)}
            </p>
          </div>
        </div>
      ),
      className: 'p-4',
    });
  }, [toast, audio, soundEnabled]);


  return (
    <NewMessageNotificationContext.Provider value={{ showNotification }}>
      {children}
    </NewMessageNotificationContext.Provider>
  );
}

export const useNewMessageNotification = () => {
  const context = useContext(NewMessageNotificationContext);
  if (context === undefined) {
    throw new Error('useNewMessageNotification must be used within a NewMessageNotificationProvider');
  }
  return context;
};
