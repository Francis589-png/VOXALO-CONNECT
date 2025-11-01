
'use server';
/**
 * @fileOverview A flow for analyzing user feedback using Genkit.
 *
 * - submitFeedback - A function that takes user feedback text and returns an analysis.
 * - FeedbackInputSchema - The Zod schema for the input.
 * - FeedbackOutputSchema - The Zod schema for the output.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';


// 1. Define Input and Output Schemas with Zod
const FeedbackInputSchema = z.string().describe('The raw text feedback from the user.');
export type FeedbackInput = z.infer<typeof FeedbackInputSchema>;

const FeedbackOutputSchema = z.object({
  category: z.enum(['Bug Report', 'Feature Request', 'General Feedback', 'Other'])
    .describe('The category of the feedback.'),
  sentiment: z.enum(['Positive', 'Negative', 'Neutral'])
    .describe('The sentiment of the feedback.'),
  summary: z.string().describe('A concise one-sentence summary of the feedback.'),
});
export type FeedbackOutput = z.infer<typeof FeedbackOutputSchema>;


// 2. Create the exported wrapper function
export async function submitFeedback(feedbackText: FeedbackInput): Promise<FeedbackOutput> {
  // This function will call the Genkit flow and return its result.
  return feedbackFlow(feedbackText);
}


// 3. Define the Genkit Prompt
const feedbackPrompt = ai.definePrompt({
  name: 'feedbackPrompt',
  input: { schema: FeedbackInputSchema },
  output: { schema: FeedbackOutputSchema },
  prompt: `You are an expert at analyzing user feedback for a software application.
  Analyze the following user feedback and provide the category, sentiment, and a brief summary.

  Feedback: {{{prompt}}}
  `,
});


// 4. Define the Genkit Flow
const feedbackFlow = ai.defineFlow(
  {
    name: 'feedbackFlow',
    inputSchema: FeedbackInputSchema,
    outputSchema: FeedbackOutputSchema,
  },
  async (feedback) => {
    // Call the prompt to get the analysis
    const { output: analysis } = await feedbackPrompt(feedback);

    if (!analysis) {
        throw new Error('Failed to analyze feedback.');
    }

    // Get the Firestore instance from the Genkit-initialized Firebase app
    const db = getFirestore();

    // Save the original feedback and the AI analysis to Firestore
    await db.collection('feedback').add({
      originalFeedback: feedback,
      analysis: analysis,
      createdAt: Timestamp.now(),
    });

    // Return the analysis to the client
    return analysis;
  }
);
