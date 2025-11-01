
'use server';

import { db } from '@/lib/firebase';
import { uploadFile } from '@/lib/pinata';
import type { User } from '@/types';
import { doc, updateDoc, arrayRemove, arrayUnion, getDoc, collection, writeBatch, getDocs, deleteDoc } from 'firebase/firestore';

export async function updateGroupDetails(
  chatId: string,
  name: string,
  photo: File | null
) {
  const chatRef = doc(db, 'chats', chatId);
  const updateData: { name?: string; photoURL?: string } = {};

  if (name) {
    updateData.name = name;
  }

  if (photo) {
    const photoURL = await uploadFile(photo);
    updateData.photoURL = photoURL;
  }
  
  if (Object.keys(updateData).length > 0) {
    await updateDoc(chatRef, updateData);
  }
}

export async function removeUserFromGroup(chatId: string, userId: string) {
    const chatRef = doc(db, 'chats', chatId);
    const chatSnap = await getDoc(chatRef);
    if (!chatSnap.exists()) throw new Error("Chat not found");

    const userInfos = chatSnap.data().userInfos as User[];
    const userToRemove = userInfos.find(u => u.uid === userId);
    
    if (userToRemove) {
        await updateDoc(chatRef, {
            users: arrayRemove(userId),
            userInfos: arrayRemove(userToRemove)
        });
    }
}

export async function addUsersToGroup(chatId: string, usersToAdd: User[]) {
    const chatRef = doc(db, 'chats', chatId);
    const userIdsToAdd = usersToAdd.map(u => u.uid);
    const userInfosToAdd = usersToAdd.map(u => ({
        uid: u.uid,
        displayName: u.displayName,
        email: u.email,
        photoURL: u.photoURL,
    }));

    await updateDoc(chatRef, {
        users: arrayUnion(...userIdsToAdd),
        userInfos: arrayUnion(...userInfosToAdd)
    });
}


export async function leaveGroup(chatId: string, userId: string) {
    await removeUserFromGroup(chatId, userId);
}

export async function deleteChat(chatId: string) {
  const chatRef = doc(db, 'chats', chatId);
  const messagesCollectionRef = collection(chatRef, 'messages');

  // Delete all messages in the subcollection
  const messagesSnapshot = await getDocs(messagesCollectionRef);
  const batch = writeBatch(db);
  messagesSnapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });
  await batch.commit();

  // Delete the chat document itself
  await deleteDoc(chatRef);
}
