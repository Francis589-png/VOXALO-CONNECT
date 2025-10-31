'use server';
/**
 * @fileOverview An audio processing flow.
 *
 * - processAudio - Encodes raw audio data to WAV and uploads it.
 * - ProcessAudioInput - The input type for the processAudio function.
 * - ProcessAudioOutput - The return type for the processAudio function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {uploadFile} from '@/lib/pinata';
import wav from 'wav';

const ProcessAudioInputSchema = z.object({
  audioDataUri: z.string().describe('The raw audio data as a base64 data URI.'),
});
export type ProcessAudioInput = z.infer<typeof ProcessAudioInputSchema>;

const ProcessAudioOutputSchema = z.object({
  audioURL: z.string(),
});
export type ProcessAudioOutput = z.infer<typeof ProcessAudioOutputSchema>;

export async function processAudio(input: ProcessAudioInput): Promise<ProcessAudioOutput> {
  return processAudioFlow(input);
}

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 44100, // Common sample rate
  sampleWidth = 2
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    const bufs: any[] = [];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs));
    });

    writer.write(pcmData);
    writer.end();
  });
}

const processAudioFlow = ai.defineFlow(
  {
    name: 'processAudioFlow',
    inputSchema: ProcessAudioInputSchema,
    outputSchema: ProcessAudioOutputSchema,
  },
  async input => {
    const { audioDataUri } = input;
    
    // Extract base64 data from data URI
    const base64Data = audioDataUri.substring(audioDataUri.indexOf(',') + 1);
    const pcmBuffer = Buffer.from(base64Data, 'base64');
    
    // Determine sample rate from browser if possible, otherwise use a default
    // This is a simplification. A more robust solution might pass sampleRate from client.
    const sampleRate = 44100; 

    // Convert PCM to WAV
    const wavBuffer = await toWav(pcmBuffer, 1, sampleRate);
    const wavFile = new File([wavBuffer], 'recording.wav', { type: 'audio/wav' });

    // Upload WAV file to Pinata
    const audioURL = await uploadFile(wavFile);

    return { audioURL };
  }
);
