
'use server';
/**
 * @fileOverview A flow for submitting user feedback.
 *
 * - submitFeedback - A function that takes user feedback text and stores it.
 */

import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { db } from '@/lib/firebase-admin';


export async function submitFeedback(feedbackText: string): Promise<void> {
  // Save the original feedback to Firestore
  await db.collection('feedback').add({
    originalFeedback: feedbackText,
    createdAt: Timestamp.now(),
  });
}
