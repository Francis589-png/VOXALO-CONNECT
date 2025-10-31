
"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
  deleteDoc,
  getDoc,
  setDoc,
  getDocs,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import type { Chat, FriendRequest, Friendship, User } from '@/types';
import { getChatId } from '@/lib/utils';

type FriendsContextType = {
  incomingRequests: FriendRequest[];
  outgoingRequests: FriendRequest[];
  friendships: Friendship[];
  users: User[];
  acceptFriendRequest: (requestId: string) => Promise<void>;
  declineFriendRequest: (requestId: string) => Promise<void>;
  sendFriendRequest: (receiverId: string) => Promise<void>;
  getFriendshipStatus: (userId: string) => 'friends' | 'pending-incoming' | 'pending-outgoing' | 'not-friends';
  createChat: (otherUser: User) => Promise<Chat>;
};

const FriendsContext = createContext<FriendsContextType | undefined>(undefined);

export function FriendsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    if (!user) {
        setIncomingRequests([]);
        setOutgoingRequests([]);
        setFriendships([]);
        setUsers([]);
        return;
    };

    const usersRef = collection(db, 'users');
    const usersUnsubscribe = onSnapshot(usersRef, (snapshot) => {
        const usersData = snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as User));
        setUsers(usersData.filter(u => u.uid !== user.uid));
    });

    const requestsRef = collection(db, 'friendRequests');

    const incomingQ = query(requestsRef, where('receiverId', '==', user.uid), where('status', '==', 'pending'));
    const incomingUnsubscribe = onSnapshot(incomingQ, async (snapshot) => {
        const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FriendRequest));
        const requestsWithSender = await Promise.all(requests.map(async (req) => {
            const senderDoc = await getDoc(doc(db, 'users', req.senderId));
            return { ...req, sender: senderDoc.data() as User };
        }));
        setIncomingRequests(requestsWithSender);
    });

    const outgoingQ = query(requestsRef, where('senderId', '==', user.uid), where('status', '==', 'pending'));
    const outgoingUnsubscribe = onSnapshot(outgoingQ, async (snapshot) => {
        const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FriendRequest));
        const requestsWithReceiver = await Promise.all(requests.map(async (req) => {
            const receiverDoc = await getDoc(doc(db, 'users', req.receiverId));
            return { ...req, receiver: receiverDoc.data() as User };
        }));
        setOutgoingRequests(requestsWithReceiver);
    });
    
    const friendshipsRef = collection(db, 'friendships');
    const friendshipsQ = query(friendshipsRef, where('users', 'array-contains', user.uid));
    const friendshipsUnsubscribe = onSnapshot(friendshipsQ, async (snapshot) => {
      const friendshipsData = await Promise.all(snapshot.docs.map(async (friendshipDoc) => {
        const data = friendshipDoc.data();
        const friendId = data.users.find((id: string) => id !== user.uid);
        
        if (!friendId) {
            return null;
        }

        const userDoc = await getDoc(doc(db, 'users', friendId));
        if (!userDoc.exists()) {
            return null;
        }
        const friend = userDoc.data() as User;
        
        return {
          id: friendshipDoc.id,
          ...data,
          friend,
        } as Friendship;
      }));
      setFriendships(friendshipsData.filter(f => f && f.friend) as Friendship[]);
    });

    return () => {
        usersUnsubscribe();
        incomingUnsubscribe();
        outgoingUnsubscribe();
        friendshipsUnsubscribe();
    };
  }, [user]);

  const acceptFriendRequest = async (requestId: string) => {
    const requestRef = doc(db, 'friendRequests', requestId);
    const requestSnap = await getDoc(requestRef);
    if(requestSnap.exists()){
        const request = requestSnap.data() as FriendRequest;
        await updateDoc(requestRef, { status: 'accepted' });
        
        const friendshipRef = collection(db, 'friendships');
        await addDoc(friendshipRef, {
            users: [request.senderId, request.receiverId],
            createdAt: serverTimestamp(),
        });

        const chatId = getChatId(request.senderId, request.receiverId);
        const chatRef = doc(db, 'chats', chatId);
        const chatSnap = await getDoc(chatRef);
        if (chatSnap.exists()) {
            await updateDoc(chatRef, {
                lastMessage: {
                    text: 'Friend request accepted!',
                    senderId: 'system',
                    timestamp: serverTimestamp(),
                }
            })
        }
    }
  };

  const declineFriendRequest = async (requestId: string) => {
    const requestRef = doc(db, 'friendRequests', requestId);
    await updateDoc(requestRef, { status: 'declined' });
  };
  
  const sendFriendRequest = async (receiverId: string) => {
    if (!user) return;

    const requestsRef = collection(db, "friendRequests");
    const q = query(
      requestsRef,
      where("senderId", "in", [user.uid, receiverId]),
      where("receiverId", "in", [user.uid, receiverId])
    );

    const existingRequests = await getDocs(q);
    if (!existingRequests.empty) {
        return; // Request already exists
    }

    const request = {
      senderId: user.uid,
      receiverId,
      status: 'pending',
      createdAt: serverTimestamp(),
    };
    await addDoc(collection(db, 'friendRequests'), request);
  };

  const getFriendshipStatus = (userId: string) => {
    if (friendships.some(f => f.friend.uid === userId)) {
      return 'friends';
    }
    if (incomingRequests.some(r => r.senderId === userId)) {
      return 'pending-incoming';
    }
    if (outgoingRequests.some(r => r.receiverId === userId)) {
      return 'pending-outgoing';
    }
    return 'not-friends';
  }

  const createChat = async (otherUser: User): Promise<Chat> => {
    if (!user) throw new Error("User not authenticated");

    const chatId = getChatId(user.uid, otherUser.uid);
    const chatRef = doc(db, 'chats', chatId);
    const chatSnap = await getDoc(chatRef);

    if (!chatSnap.exists()) {
      const currentUserDoc = await getDoc(doc(db, 'users', user.uid));
      const newChat = {
        id: chatId,
        users: [user.uid, otherUser.uid],
        userInfos: [currentUserDoc.data() as User, otherUser],
        createdAt: serverTimestamp(),
        isGroup: false,
      };
      await setDoc(chatRef, newChat);
      return newChat as Chat;
    }
    return {id: chatSnap.id, ...chatSnap.data()} as Chat;
  }


  return (
    <FriendsContext.Provider value={{ incomingRequests, outgoingRequests, friendships, users, acceptFriendRequest, declineFriendRequest, sendFriendRequest, getFriendshipStatus, createChat }}>
      {children}
    </FriendsContext.Provider>
  );
}

export const useFriends = () => {
  const context = useContext(FriendsContext);
  if (context === undefined) {
    throw new Error('useFriends must be used within a FriendsProvider');
  }
  return context;
};
