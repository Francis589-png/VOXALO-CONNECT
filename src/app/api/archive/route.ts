
import { NextResponse } from 'next/server';
import axios from 'axios';

const ARCHIVE_API_URL = 'https://archive.org/advancedsearch.php';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return new NextResponse('Search query is required.', { status: 400 });
  }

  try {
    const response = await axios.get(ARCHIVE_API_URL, {
      params: {
        q: `${query} AND mediatype:(movies)`,
        'fl[]': 'identifier,title,description,year',
        rows: 50,
        page: 1,
        output: 'json',
      },
    });

    return NextResponse.json(response.data.response.docs);
  } catch (error: any) {
    console.error('Error fetching from Internet Archive API:', error.response?.data || error.message);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
