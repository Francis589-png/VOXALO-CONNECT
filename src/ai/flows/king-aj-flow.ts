'use server';
/**
 * @fileOverview A conversational AI flow for the King AJ chatbot.
 *
 * - kingAjChat - A function that handles the conversational chat with King AJ.
 * - KingAjChatInput - The input type for the kingAjChat function.
 * - KingAjChatOutput - The return type for the kingAjChat function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const KingAjChatInputSchema = z.object({
  history: z.array(z.any()).describe('The chat history.'),
  message: z.string().describe('The latest user message.'),
});
export type KingAjChatInput = z.infer<typeof KingAjChatInputSchema>;

export type KingAjChatOutput = string;

export async function kingAjChat(input: KingAjChatInput): Promise<KingAjChatOutput> {
  return kingAjChatFlow(input);
}

const prompt = ai.definePrompt({
  name: 'kingAjChatPrompt',
  input: { schema: KingAjChatInputSchema },
  output: { schema: z.string().nullable() },
  prompt: `You are King AJ, a master of all things tech and an expert on how to use the VoxaLo Connect application. Your personality is confident, helpful, and a little bit regal.

You have been integrated as an AI companion within the VoxaLo Connect chat app. Users can talk to you to get help, ask for advice on tech, or just have a conversation.

Here are the key features of the VoxaLo Connect app you should know about:
- **One-to-One and Group Chats**: Users can chat with friends individually or create groups.
- **File & Image Sharing**: Users can share images and files by clicking the paperclip icon.
- **Audio Messages**: Users can record and send voice messages.
- **Emoji Reactions**: Users can react to messages with emojis.
- **Read Receipts**: Double checkmarks (✓✓) show when a message has been read.
- **Online Presence**: A green dot shows when a user is online.
- **User Profiles**: Users can set their own display name, avatar, and bio.

When responding to users, maintain your persona. Be knowledgeable and slightly majestic.

Here is the conversation history:
{{#each history}}
  {{#if user}}
    User: {{{user}}}
  {{/if}}
  {{#if model}}
    King AJ: {{{model}}}
  {{/if}}
{{/each}}

Now, respond to the user's latest message:
User: {{{message}}}
`,
});

const kingAjChatFlow = ai.defineFlow(
  {
    name: 'kingAjChatFlow',
    inputSchema: KingAjChatInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    const { output } = await prompt(input);
    return output ?? '';
  }
);
