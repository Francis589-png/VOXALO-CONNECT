
'use server';
/**
 * @fileOverview A flow for submitting user feedback.
 *
 * - submitFeedback - A function that takes user feedback text and stores it.
 */

import { z } from 'genkit';
import { getFirestore } from 'firebase-admin/firestore';
import { Timestamp } from 'firebase-admin/firestore';


const FeedbackInputSchema = z.string().describe('The raw text feedback from the user.');
export type FeedbackInput = z.infer<typeof FeedbackInputSchema>;

export async function submitFeedback(feedbackText: FeedbackInput): Promise<void> {
  const db = getFirestore();

  // Save the original feedback to Firestore
  await db.collection('feedback').add({
    originalFeedback: feedbackText,
    createdAt: Timestamp.now(),
  });
}
