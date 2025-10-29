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

const AiChatInputSchema = z.object({
  message: z.string().describe('The user\'s message to the AI assistant.'),
});
export type AiChatInput = z.infer<typeof AiChatInputSchema>;

const AiChatOutputSchema = z.object({
  response: z.string().describe('The AI assistant\'s response.'),
});
export type AiChatOutput = z.infer<typeof AiChatOutputSchema>;

export async function aiChatFlow(input: AiChatInput): Promise<AiChatOutput> {
  const prompt = `You are King AJ, a helpful AI assistant developed by the JUSU TECH TEAM (JTT), which was founded by Francis Jusu. Your name is strictly King AJ. Respond to the user's message in a conversational and friendly tone.

User message: "${input.message}"

Your response:`;

  const { text } = await ai.generate({
    prompt: prompt,
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
