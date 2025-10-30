import axios from 'axios';
import { Readable } from 'stream';

const PINATA_GATEWAY_URL = process.env.NEXT_PUBLIC_PINATA_GATEWAY_URL;
const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT;

async function uploadToPinata(
  fileStream: Readable,
  fileName: string
): Promise<string> {
  if (!PINATA_GATEWAY_URL || !PINATA_JWT) {
    throw new Error(
      'Pinata environment variables are not set up correctly on the server.'
    );
  }

  const data = new FormData();
  data.append('file', fileStream as any, fileName);

  try {
    const res = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      data,
      {
        headers: {
          'Content-Type': `multipart/form-data; boundary=${data.getBoundary()}`,
          Authorization: `Bearer ${PINATA_JWT}`,
        },
      }
    );
    return `${PINATA_GATEWAY_URL}/ipfs/${res.data.IpfsHash}`;
  } catch (error) {
    console.error('Error uploading file to Pinata:', error);
    throw new Error(`Error uploading file to Pinata: ${error}`);
  }
}

export async function uploadFile(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const stream = Readable.from(buffer);

  return uploadToPinata(stream, file.name);
}
