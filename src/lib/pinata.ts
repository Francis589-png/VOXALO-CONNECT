'use server';
import axios from 'axios';
import { Readable } from 'stream';

const PINATA_GATEWAY_URL = process.env.PINATA_GATEWAY_URL;
const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_API_KEY = process.env.PINATA_SECRET_API_KEY;

if (!PINATA_GATEWAY_URL || !PINATA_API_KEY || !PINATA_SECRET_API_KEY) {
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
  if (!PINATA_GATEWAY_URL || !PINATA_API_KEY || !PINATA_SECRET_API_KEY) {
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
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_SECRET_API_KEY,
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
