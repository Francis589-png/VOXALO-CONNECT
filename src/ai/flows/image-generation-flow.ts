
'use server';
/**
 * @fileOverview A flow for generating images from a text prompt.
 *
 * - generateImage - A function that takes a text prompt and returns a data URI for the generated image.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ImageGenerationInputSchema = z.string();
export type ImageGenerationInput = z.infer<typeof ImageGenerationInputSchema>;

const ImageGenerationOutputSchema = z.string();
export type ImageGenerationOutput = z.infer<typeof ImageGenerationOutputSchema>;


export async function generateImage(prompt: ImageGenerationInput): Promise<ImageGenerationOutput> {
    return imageGenerationFlow(prompt);
}

const imageGenerationFlow = ai.defineFlow(
  {
    name: 'imageGenerationFlow',
    inputSchema: ImageGenerationInputSchema,
    outputSchema: ImageGenerationOutputSchema,
  },
  async (prompt) => {
    const { media } = await ai.generate({
        model: 'googleai/imagen-4.0-fast-generate-001',
        prompt: prompt,
    });
    
    const url = media.url;
    if (!url) {
        throw new Error('Image generation failed to return a URL.');
    }
    
    return url;
  }
);
