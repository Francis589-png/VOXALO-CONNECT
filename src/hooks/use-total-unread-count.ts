
'use client';
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Chat, Message } from '@/types';

export function useTotalUnreadCount(currentUserId?: string) {
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);

  useEffect(() => {
    if (!currentUserId) {
      setTotalUnreadCount(0);
      return;
    }

    const chatsRef = collection(db, 'chats');
    const q = query(chatsRef, where('users', 'array-contains', currentUserId));

    const unsubscribe = onSnapshot(q, (chatsSnapshot) => {
      let totalCount = 0;
      const chatPromises = chatsSnapshot.docs.map(chatDoc => {
        return new Promise<number>(resolve => {
          const messagesRef = collection(db, 'chats', chatDoc.id, 'messages');
          const messagesQuery = query(
            messagesRef,
            where('senderId', '!=', currentUserId)
          );

          const messagesUnsubscribe = onSnapshot(messagesQuery, (messagesSnapshot) => {
            let chatUnreadCount = 0;
            messagesSnapshot.forEach((messageDoc) => {
              const message = messageDoc.data() as Message;
              if (!message.readBy?.includes(currentUserId)) {
                chatUnreadCount++;
              }
            });
            resolve(chatUnreadCount);
            messagesUnsubscribe(); // Unsubscribe after getting the count for this chat
          }, () => resolve(0)); // Resolve with 0 on error
        });
      });

      Promise.all(chatPromises).then(counts => {
        totalCount = counts.reduce((sum, count) => sum + count, 0);
        setTotalUnreadCount(totalCount);
      });
    });

    return () => unsubscribe();
  }, [currentUserId]);

  return totalUnreadCount;
}
