
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Message } from "@/types";
import type { Timestamp } from "firebase/firestore";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getChatId(userId1: string, userId2:string) {
  return [userId1, userId2].sort().join('_');
}

export const getMessagePreview = (message: Message) => {
    switch (message.type) {
      case 'image':
        return 'Sent an image';
      case 'file':
        return `Sent a file: ${message.fileName || 'attachment'}`;
      default:
        return message.text;
    }
  }

export function makeSerializable(obj: any): any {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }

  // Handle Firestore Timestamps
  if (obj.toDate && typeof obj.toDate === 'function') {
    return obj.toDate().toISOString();
  }

  if (Array.isArray(obj)) {
    return obj.map(makeSerializable);
  }

  const newObj: { [key: string]: any } = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      newObj[key] = makeSerializable(obj[key]);
    }
  }

  return newObj;
}
