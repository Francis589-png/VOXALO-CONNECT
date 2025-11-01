
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
  messageSentSoundEnabled?: boolean;
  bio?: string;
  theme?: 'light' | 'dark' | 'system';
  blockedUsers?: string[];
  isVerified?: boolean;
  isBanned?: boolean;
  suspendedUntil?: Timestamp | null;
}

export interface ReplyMessage {
  messageId: string;
  senderId: string;
  senderName: string;
  text: string | null;
  type: 'text' | 'image' | 'file';
  imageURL: string | null;
  fileName: string | null;
}


export interface Message {
  id: string;
  text?: string;
  senderId: string;
  timestamp: Timestamp | Date;
  readBy?: string[];
  deletedFor?: string[];
  reactions?: { [emoji: string]: string[] };
  type: 'text' | 'image' | 'file' | 'game';
  imageURL?: string;
  fileURL?: string;
  fileName?: string;
  fileSize?: number;
  replyTo?: ReplyMessage;
  editedAt?: Timestamp;
  role?: 'user' | 'model';
  content?: { text: string }[];
  gameType?: 'checkers';
  gameId?: string;
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
  pinnedMessage?: Message | null;
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
  blockedUsers?: string[];
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

// --- JTT News Types ---
export interface JttNewsPost {
    id: string;
    authorId: string;
    authorName: string;
    authorPhotoURL: string;
    text: string;
    link?: string;
    imageURL?: string;
    createdAt: Timestamp;
}

// --- Checkers Game Types ---
export type Player = 'red' | 'black';

export interface Piece {
    player: Player;
    isKing: boolean;
}

export type Square = Piece | null;
export type Board = Square[][];

export interface CheckersGame {
    id: string;
    board: Board;
    players: {
        red: string; // user id
        black: string; // user id
    };
    playerNames: {
        red: string;
        black: string;
    };
    turn: Player;
    winner: Player | null;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    gameOver: boolean;
    lastMove?: { from: [number, number], to: [number, number] };
}

// --- Feedback Type ---
export interface Feedback {
    id: string;
    originalFeedback: string;
    createdAt: Timestamp;
}
