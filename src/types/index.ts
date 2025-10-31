import type { User as FirebaseUser } from 'firebase/auth';
import type { Timestamp } from 'firebase/firestore';

export interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  lastSeen?: Timestamp;
  status?: 'online' | 'offline';
  fcmToken?: string;
  readReceiptsEnabled?: boolean;
  bio?: string;
  theme?: 'light' | 'dark' | 'system';
  chatWallpaper?: string;
}

export interface Message {
  id: string;
  text?: string;
  senderId: string;
  timestamp: Timestamp | Date;
  readBy?: string[];
  deletedFor?: string[];
  reactions?: { [emoji: string]: string[] };
  type: 'text' | 'audio' | 'image' | 'file';
  audioURL?: string;
  imageURL?: string;
  fileURL?: string;
  fileName?: string;
  fileSize?: number;
}

export interface Chat {
  id: string;
  users: string[];
  userInfos: User[];
  lastMessage?: Message;
  isGroup?: boolean;
  name?: string;
  photoURL?: string;
  createdAt?: Timestamp;
}

export interface FriendRequest {
  id:string;
  senderId: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Timestamp;
  sender?: User;
  receiver?: User;
}

export type Friendship = {
  id: string;
  users: string[];
  userInfos: { [key: string]: User };
  friend: User;
};
