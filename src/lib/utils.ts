
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getChatId(userId1: string, userId2: string) {
  return [userId1, userId2].sort().join('_');
}
