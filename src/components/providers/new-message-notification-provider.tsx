
'use client';
import { createContext, useContext, useCallback, ReactNode } from 'react';
import type { User, Message } from '@/types';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Button } from '../ui/button';
import { X } from 'lucide-react';

interface NewMessageNotificationContextType {
  showNotification: (sender: User, message: Message) => void;
}

const NewMessageNotificationContext = createContext<NewMessageNotificationContextType | undefined>(undefined);

export function NewMessageNotificationProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();

  const getMessagePreview = (message: Message) => {
    switch (message.type) {
      case 'image':
        return 'Sent an image';
      case 'file':
        return `Sent a file: ${message.fileName}`;
      default:
        return message.text;
    }
  }

  const showNotification = useCallback((sender: User, message: Message) => {
    try {
        const audio = new Audio('/notification.mp3');
        audio.play().catch(e => console.error("Error playing notification sound:", e));
    } catch (e) {
        console.error("Could not play notification sound", e);
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
  }, [toast]);


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
