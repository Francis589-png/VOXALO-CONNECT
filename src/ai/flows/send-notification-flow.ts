'use server';
/**
 * @fileOverview A flow for sending FCM notifications.
 *
 * - sendNotificationFlow - A function that sends a push notification via FCM.
 * - SendNotificationInput - The input type for the sendNotificationFlow function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SendNotificationInputSchema = z.object({
  recipientToken: z.string().describe('The FCM token of the recipient device.'),
  title: z.string().describe('The title of the notification.'),
  body: z.string().describe('The body content of the notification.'),
});

export type SendNotificationInput = z.infer<
  typeof SendNotificationInputSchema
>;

export async function sendNotificationFlow(
  input: SendNotificationInput
): Promise<void> {
  return flow(input);
}

const flow = ai.defineFlow(
  {
    name: 'sendNotificationFlow',
    inputSchema: SendNotificationInputSchema,
    outputSchema: z.void(),
  },
  async (input) => {
    const serverKey = process.env.FCM_SERVER_KEY;

    if (!serverKey) {
      console.error('FCM_SERVER_KEY is not set in environment variables.');
      throw new Error('FCM server key is not configured.');
    }

    const messagePayload = {
      to: input.recipientToken,
      notification: {
        title: input.title,
        body: input.body,
        sound: 'notification.mp3', // Reference to the file in /public
      },
    };

    try {
      const response = await fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `key=${serverKey}`,
        },
        body: JSON.stringify(messagePayload),
      });

      const responseData = await response.json();

      if (!response.ok || responseData.failure) {
        console.error('FCM send failed:', responseData);
        throw new Error(`FCM error: ${JSON.stringify(responseData.results)}`);
      }

      console.log('FCM response:', responseData);
    } catch (error) {
      console.error('Error sending FCM notification:', error);
      throw error;
    }
  }
);