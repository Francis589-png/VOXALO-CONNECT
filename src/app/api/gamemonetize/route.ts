
import { NextResponse } from 'next/server';

const GAMEMONETIZE_API_URL = 'https://gamemonetize.com/feed.json';
const CACHE_REVALIDATION_TIME_SECONDS = 3600; // 1 hour

export async function GET() {
  try {
    const response = await fetch(GAMEMONETIZE_API_URL, {
      next: { revalidate: CACHE_REVALIDATION_TIME_SECONDS },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch games: ${response.statusText}`);
    }

    const data = await response.json();
    // The API returns an object with a "games" property which is the array
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching from GameMonetize API:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

    