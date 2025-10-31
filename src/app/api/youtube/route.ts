
import { NextResponse } from 'next/server';
import axios from 'axios';

const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3/search';
const API_KEY = process.env.YOUTUBE_API_KEY;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!API_KEY) {
    return new NextResponse('YouTube API key is not configured.', { status: 500 });
  }

  if (!query) {
    return new NextResponse('Search query is required.', { status: 400 });
  }

  try {
    const response = await axios.get(YOUTUBE_API_URL, {
      params: {
        part: 'snippet',
        q: query,
        key: API_KEY,
        type: 'video',
        maxResults: 20,
      },
    });

    return NextResponse.json(response.data.items);
  } catch (error: any) {
    console.error('Error fetching from YouTube API:', error.response?.data || error.message);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
