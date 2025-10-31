
import { NextResponse } from 'next/server';
import axios from 'axios';

const PEXELS_API_URL = 'https://api.pexels.com/v1/videos/search';
const API_KEY = process.env.PEXELS_API_KEY;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!API_KEY) {
    return new NextResponse('Pexels API key is not configured.', { status: 500 });
  }

  if (!query) {
    return new NextResponse('Search query is required.', { status: 400 });
  }

  try {
    const response = await axios.get(PEXELS_API_URL, {
      params: {
        query,
        per_page: 20,
      },
      headers: {
        Authorization: API_KEY,
      },
    });

    return NextResponse.json(response.data.videos, {
        headers: {
            'Cache-Control': 's-maxage=3600, stale-while-revalidate',
        }
    });
  } catch (error: any) {
    console.error('Error fetching from Pexels API:', error.response?.data || error.message);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
