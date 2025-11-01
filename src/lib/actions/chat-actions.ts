
'use server';

import { db } from '@/lib/firebase';
import type { Message } from '@/types';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';

export async function pinMessage(chatId: string, message: Message) {
  const chatRef = doc(db, 'chats', chatId);

  // Firestore doesn't store 'undefined', so we convert to 'null'
  const sanitizedMessage = JSON.parse(JSON.stringify(message, (key, value) => {
    return (value === undefined) ? null : value;
  }));

  await updateDoc(chatRef, {
    pinnedMessage: sanitizedMessage,
    lastMessage: {
        text: `Pinned a message`,
        senderId: message.senderId,
        timestamp: serverTimestamp(),
        type: 'text'
    }
  });
}

export async function unpinMessage(chatId: string) {
  const chatRef = doc(db, 'chats', chatId);
  await updateDoc(chatRef, {
    pinnedMessage: null,
  });
}
