'use server';

import { db } from '@/lib/firebase';
import { uploadFile } from '@/lib/pinata';
import type { Chat, User } from '@/types';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

export async function createGroupChat(formData: FormData): Promise<Chat> {
  const name = formData.get('name') as string;
  const userIds = JSON.parse(formData.get('userIds') as string) as string[];
  const userInfos = JSON.parse(formData.get('userInfos') as string) as User[];
  const photo = formData.get('photo') as File | null;

  let photoURL: string | undefined = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name
  )}&background=random&size=128`;
  if (photo) {
    photoURL = await uploadFile(photo);
  }

  const chatRef = await addDoc(collection(db, 'chats'), {
    name,
    users: userIds,
    userInfos,
    isGroup: true,
    photoURL,
    createdAt: serverTimestamp(),
    createdBy: userIds[0], // Assuming the creator is the first user
  });

  return {
    id: chatRef.id,
    name,
    users: userIds,
    userInfos,
    isGroup: true,
    photoURL,
  } as Chat;
}
