'use server';

import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function submitFeedback(feedbackText: string): Promise<void> {
  // Save the original feedback to Firestore using the client SDK
  await addDoc(collection(db, 'feedback'), {
    originalFeedback: feedbackText,
    createdAt: serverTimestamp(),
  });
}
