'use server';
/**
 * @fileOverview A flow for handling AI chat responses.
 *
 * - aiChatFlow - A function that takes a message and returns an AI-generated response.
 * - AiChatInput - The input type for the aiChatFlow function.
 * - AiChatOutput - The return type for the aiChatFlow function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

const AiChatInputSchema = z.object({
  history: z.array(MessageSchema).describe('The conversation history.'),
  message: z.string().describe("The user's message to the AI assistant."),
});
export type AiChatInput = z.infer<typeof AiChatInputSchema>;

const AiChatOutputSchema = z.object({
  response: z.string().describe("The AI assistant's response."),
});
export type AiChatOutput = z.infer<typeof AiChatOutputSchema>;

export async function aiChatFlow(input: AiChatInput): Promise<AiChatOutput> {
  const history = (input.history || []).map((msg) => ({
    role: msg.role,
    content: [{ text: msg.content }],
  }));

  // The last message in the history is the current user message, so we don't need to add it separately.
  const { text } = await ai.generate({
    history,
    prompt: `You are King AJ, a helpful AI assistant. Your name is strictly King AJ. Respond to the user's message in a conversational and friendly tone.

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
