
'use server';
/**
 * @fileOverview Generates contextual reply suggestions for a chat conversation.
 *
 * - getReplySuggestions - A function that takes a history of messages and returns a list of suggested replies.
 * - GetReplySuggestionsInput - The input type for the getReplySuggestions function.
 * - GetReplySuggestionsOutput - The return type for the getReplySuggestions function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const MessageInputSchema = z.object({
  text: z.string().describe('The content of the message.'),
  isUser: z.boolean().describe('Whether this message was sent by the current user.'),
});

const GetReplySuggestionsInputSchema = z.object({
  history: z.array(MessageInputSchema).describe('The last few messages in the conversation.'),
});
export type GetReplySuggestionsInput = z.infer<typeof GetReplySuggestionsInputSchema>;

const GetReplySuggestionsOutputSchema = z.object({
  suggestions: z.array(z.string()).describe('A list of 3 short, relevant, and natural-sounding reply suggestions.'),
});
export type GetReplySuggestionsOutput = z.infer<typeof GetReplySuggestionsOutputSchema>;

export async function getReplySuggestions(input: GetReplySuggestionsInput): Promise<GetReplySuggestionsOutput> {
  return replySuggestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'replySuggestionPrompt',
  input: { schema: GetReplySuggestionsInputSchema },
  output: { schema: GetReplySuggestionsOutputSchema },
  prompt: `You are an AI assistant integrated into a chat application. Your task is to generate three concise, relevant, and natural-sounding reply suggestions for the user based on the recent conversation history. The user is the one for whom "isUser" is true. Generate suggestions for them to send.

The suggestions should be:
- Short and to the point (2-4 words).
- Contextually relevant to the last message.
- Varied in tone (e.g., a question, an affirmation, an emoji-containing phrase).
- Actionable or conversational. Do not suggest replies like "Okay" or "Got it" unless it is a very natural response.

Here is the recent conversation history (most recent message is last):
{{#each history}}
{{#if isUser}}You:{{else}}Them:{{/if}} {{{text}}}
{{/each}}

Generate 3 suggestions for "You" to say next.`,
});

const replySuggestionFlow = ai.defineFlow(
  {
    name: 'replySuggestionFlow',
    inputSchema: GetReplySuggestionsInputSchema,
    outputSchema: GetReplySuggestionsOutputSchema,
  },
  async (input) => {
    // Ensure we don't send an empty history to the model
    if (input.history.length === 0) {
      return { suggestions: [] };
    }

    const { output } = await prompt(input);
    return output ?? { suggestions: [] };
  }
);
