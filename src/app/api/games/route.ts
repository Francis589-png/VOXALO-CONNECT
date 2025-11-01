
import { NextResponse } from 'next/server';

const FREETOGAME_API_URL = 'https://www.freetogame.com/api/games';
const CACHE_REVALIDATION_TIME_SECONDS = 3600; // 1 hour

export async function GET() {
  try {
    const response = await fetch(FREETOGAME_API_URL, {
      next: { revalidate: CACHE_REVALIDATION_TIME_SECONDS },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch games: ${response.statusText}`);
    }

    const games = await response.json();
    return NextResponse.json(games);
  } catch (error) {
    console.error('Error fetching from FreeToGame API:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

    