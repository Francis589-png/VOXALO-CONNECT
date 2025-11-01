
'use server';

import { db } from '@/lib/firebase';
import type { Message } from '@/types';
import { doc, serverTimestamp, updateDoc, Timestamp } from 'firebase/firestore';

// A helper function to convert date strings back to Timestamps
function reviveTimestamps(obj: any): any {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(reviveTimestamps);
  }

  const newObj: { [key: string]: any } = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(value)) {
        newObj[key] = Timestamp.fromDate(new Date(value));
      } else {
        newObj[key] = reviveTimestamps(value);
      }
    }
  }

  return newObj;
}


export async function pinMessage(chatId: string, message: Message) {
  const chatRef = doc(db, 'chats', chatId);
  
  const revivedMessage = reviveTimestamps(message);

  await updateDoc(chatRef, {
    pinnedMessage: revivedMessage,
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
