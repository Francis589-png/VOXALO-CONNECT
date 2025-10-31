import axios from 'axios';

const PINATA_GATEWAY_URL = process.env.NEXT_PUBLIC_PINATA_GATEWAY_URL;
const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT;

export async function uploadFile(file: File): Promise<string> {
    if (!PINATA_GATEWAY_URL || !PINATA_JWT) {
        throw new Error(
        'Pinata environment variables are not set up correctly.'
        );
    }

    const data = new FormData();
    data.append('file', file, file.name);

    try {
        const res = await axios.post(
            'https://api.pinata.cloud/pinning/pinFileToIPFS',
            data,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
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
