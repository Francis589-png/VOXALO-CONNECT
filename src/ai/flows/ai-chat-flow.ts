
'use server';
/**
 * @fileOverview A flow for handling AI chat responses.
 *
 * - aiChatFlow - A function that takes a message and returns an AI-generated response.
 * - AiChatInput - The input type for the aiChatFlow function.
 * - AiChatOutput - The return type for the ai--chat-flow.ts function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { Message as FirestoreMessage } from '@/types';

const SerializableMessageSchema = z.object({
  id: z.string(),
  text: z.string(),
  senderId: z.string(),
  timestamp: z.string(), // Timestamps are passed as ISO strings
  fileUrl: z.string().optional(),
  fileType: z.string().optional(),
  fileName: z.string().optional(),
  readBy: z.array(z.string()).optional(),
  deletedFor: z.array(z.string()).optional(),
});

const AiChatInputSchema = z.object({
  history: z
    .array(SerializableMessageSchema)
    .optional()
    .describe('The conversation history from Firestore.'),
  message: z.string().describe("The user's message to the AI assistant."),
});
export type AiChatInput = z.infer<typeof AiChatInputSchema>;

const AiChatOutputSchema = z.object({
  response: z.string().describe("The AI assistant's response."),
});
export type AiChatOutput = z.infer<typeof AiChatOutputSchema>;

export async function aiChatFlow(input: AiChatInput): Promise<AiChatOutput> {
  const firestoreHistory = (input.history || []) as FirestoreMessage[];

  // Transform the Firestore messages into the format the AI model expects
  const history = firestoreHistory.map((msg) => {
    return {
      role: msg.senderId === 'ai-assistant' ? ('model' as const) : ('user' as const),
      content: [{ text: msg.text }],
    };
  });

  // Add the new user message to the history
  history.push({
    role: 'user',
    content: [{ text: input.message }],
  });
  
  const { text } = await ai.generate({
    history,
    system: `You are King AJ, a helpful AI assistant and a tech expert. Your name is strictly King AJ. Respond to the user's message in a conversational and friendly tone. When explaining technical concepts, break them down into simple terms and provide code examples where appropriate.

If the user asks who created you or what your origin is, you should state that you were developed by the JUSU TECH TEAM (JTT), which was founded by Francis Jusu. Do not volunteer this information unless you are asked.`,
  });

  return { response: text };
}

ai.defineFlow(
  {
    name: 'aiChatFlow',
    inputSchema: AiChatInputSchema,
    outputSchema: AiChatOutputSchema,
  },
  async (input) => {
    return await aiChatFlow(input);
  }
);
