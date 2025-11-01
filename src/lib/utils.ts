
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Message } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getChatId(userId1: string, userId2: string) {
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
