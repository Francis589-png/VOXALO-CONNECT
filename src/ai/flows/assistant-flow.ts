'use server';
/**
 * @fileOverview A simple conversational AI flow.
 *
 * - chatWithAssistant - A function that takes a history of messages and returns an AI-generated response.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { Message } from '@/types';

// Define the schema for a single message in the history
const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.array(z.object({ text: z.string() })),
});

// Define the input schema for the flow
const AssistantInputSchema = z.object({
  history: z.array(MessageSchema),
});
export type AssistantInput = z.infer<typeof AssistantInputSchema>;

// Define the output schema for the flow
const AssistantOutputSchema = z.string();
export type AssistantOutput = z.infer<typeof AssistantOutputSchema>;

// The main function that will be called from the client
export async function chatWithAssistant(history: Message[]): Promise<AssistantOutput> {
    // Convert the messages from the app's format to the flow's input format
    const flowHistory = history.map(msg => ({
        role: msg.senderId === 'user' ? 'user' : 'model',
        content: [{ text: msg.text || '' }]
    }));
    return assistantFlow({ history: flowHistory });
}

// Define the Genkit flow
const assistantFlow = ai.defineFlow(
  {
    name: 'assistantFlow',
    inputSchema: AssistantInputSchema,
    outputSchema: AssistantOutputSchema,
  },
  async (input) => {
    const { output } = await ai.generate({
      prompt: input.history,
      model: 'googleai/gemini-2.5-flash',
      config: {
        temperature: 0.7,
      },
    });

    return output?.text ?? 'Sorry, I could not generate a response.';
  }
);
