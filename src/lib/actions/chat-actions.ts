
'use server';

import { db } from '@/lib/firebase';
import type { Message } from '@/types';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';

export async function pinMessage(chatId: string, message: Message) {
  const chatRef = doc(db, 'chats', chatId);

  // The 'message' object is not a plain object because of the Firestore Timestamp.
  // We can spread it into a new object to make it serializable for Firestore.
  const plainMessageObject = { ...message };

  await updateDoc(chatRef, {
    pinnedMessage: plainMessageObject,
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
