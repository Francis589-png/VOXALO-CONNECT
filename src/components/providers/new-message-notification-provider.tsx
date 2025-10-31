
'use client';
import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { User, Message } from '@/types';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

interface NotificationData {
  sender: User;
  message: Message;
}

interface NewMessageNotificationContextType {
  showNotification: (sender: User, message: Message) => void;
}

const NewMessageNotificationContext = createContext<NewMessageNotificationContextType | undefined>(undefined);

export function NewMessageNotificationProvider({ children }: { children: ReactNode }) {
  const [notification, setNotification] = useState<NotificationData | null>(null);

  const showNotification = useCallback((sender: User, message: Message) => {
    setNotification({ sender, message });
  }, []);

  const handleClose = () => {
    setNotification(null);
  };

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

  return (
    <NewMessageNotificationContext.Provider value={{ showNotification }}>
      {children}
      <Dialog open={!!notification} onOpenChange={(isOpen) => !isOpen && handleClose()}>
        <DialogContent className="sm:max-w-[425px]">
          {notification && (
            <div className="flex flex-col items-center text-center p-4">
              <Avatar className="h-20 w-20 mb-4">
                <AvatarImage src={notification.sender.photoURL || undefined} alt={notification.sender.displayName || 'Sender'} />
                <AvatarFallback>{notification.sender.displayName?.[0]}</AvatarFallback>
              </Avatar>
              <h3 className="font-bold text-lg">New Message From</h3>
              <p className="text-xl font-semibold text-primary">{notification.sender.displayName}</p>
              <div className="mt-4 p-3 bg-muted rounded-lg w-full text-left">
                <p className="text-sm text-muted-foreground break-words">{getMessagePreview(notification.message)}</p>
              </div>
              <Button onClick={handleClose} className="mt-6 w-full">
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
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
