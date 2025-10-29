'use server';
import axios from 'axios';
import { Readable } from 'stream';

const PINATA_GATEWAY_URL = process.env.PINATA_GATEWAY_URL;
const PINATA_JWT = process.env.PINATA_JWT;

if (!PINATA_GATEWAY_URL || !PINATA_JWT) {
  if (process.env.NODE_ENV !== 'development') {
    console.warn(
      'Pinata environment variables are not set. File uploads will not work.'
    );
  }
}

async function uploadToPinata(
  fileStream: Readable,
  fileName: string
): Promise<string> {
  if (!PINATA_GATEWAY_URL || !PINATA_JWT) {
    throw new Error(
      'Pinata environment variables are not set up correctly on the server.'
    );
  }
  const formData = new FormData();
  const blob = new Blob([await fileStream.read()]);
  formData.append('file', blob, fileName);

  const response = await axios.post(
    'https://api.pinata.cloud/pinning/pinFileToIPFS',
    formData,
    {
      headers: {
        'Content-Type': `multipart/form-data;`,
        Authorization: `Bearer ${PINATA_JWT}`,
      },
    }
  );

  return `${PINATA_GATEWAY_URL}/ipfs/${response.data.IpfsHash}`;
}

export async function uploadFile(
  formData: FormData
): Promise<{ fileUrl: string; fileType: string } | { error: string }> {
  try {
    const file = formData.get('file') as File;
    if (!file) {
      return { error: 'No file found in form data' };
    }

    const fileStream = Readable.from(Buffer.from(await file.arrayBuffer()));
    const fileUrl = await uploadToPinata(fileStream, file.name);

    return { fileUrl, fileType: file.type };
  } catch (err: any) {
    console.error('Error uploading file to Pinata:', err);
    return { error: err.message || 'An unknown error occurred during upload.' };
  }
}
