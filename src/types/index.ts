
import type { User as FirebaseUser } from 'firebase/auth';
import type { Timestamp } from 'firebase/firestore';

export interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  lastSeen?: Timestamp;
  status?: 'online' | 'offline';
  statusMessage?: string; // New field for custom status
  fcmToken?: string;
  readReceiptsEnabled?: boolean;
  notificationSounds?: boolean;
  bio?: string;
  theme?: 'light' | 'dark' | 'system';
}

export interface Message {
  id: string;
  text?: string;
  senderId: string;
  timestamp: Timestamp | Date;
  readBy?: string[];
  deletedFor?: string[];
  reactions?: { [emoji: string]: string[] };
  type: 'text' | 'image' | 'file' | 'audio';
  imageURL?: string;
  fileURL?: string;
  fileName?: string;
  fileSize?: number;
  audioURL?: string;
  audioDuration?: number;
  replyTo?: {
    messageId: string;
    senderId: string;
    senderName: string;
    text: string | null;
    type: 'text' | 'image' | 'file' | 'audio';
    imageURL: string | null;
    fileName: string | null;
    audioURL: string | null;
  };
  editedAt?: Timestamp;
  role?: 'user' | 'model';
  content?: { text: string }[];
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
  createdBy?: string;
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

// --- Game Types ---

export interface Game {
    id: number;
    title: string;
    thumbnail: string;
    short_description: string;
    game_url: string;
    genre: string;
    platform: string;
    publisher: string;
    developer: string;
    release_date: string;
    freetogame_profile_url: string;
}

export interface GameMonetizeGame {
  id: string;
  title: string;
  description: string;
  thumb: string;
  url: string;
  category: string;
  width: string;
  height: string;
}

// --- Video Types ---
export interface ArchiveVideo {
  identifier: string;
  title: string;
  description: string;
  year: string;
}
