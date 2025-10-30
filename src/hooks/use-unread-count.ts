
'use client';
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Message } from '@/types';

export function useUnreadCount(chatId: string | null, currentUserId?: string) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!chatId || !currentUserId) {
      setUnreadCount(0);
      return;
    }

    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(
      messagesRef,
      where('senderId', '!=', currentUserId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let count = 0;
      snapshot.forEach((doc) => {
        const message = doc.data() as Message;
        if (!message.readBy?.includes(currentUserId)) {
          count++;
        }
      });
      setUnreadCount(count);
    });

    return () => unsubscribe();
  }, [chatId, currentUserId]);

  return unreadCount;
}
