import { NextResponse } from 'next/server';

// Define the backend URL (assuming it runs on localhost:8000)
const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8000';

export async function POST(request: Request) {
  try {
    // Optionally, you can get a specific sourceId or config from the request body
    // const { sourceId } = await request.json();
    const backendResponse = await fetch(`${BACKEND_URL}/sources/crawl`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // body: JSON.stringify({ sourceId }), // If needed
    });

    if (!backendResponse.ok) {
      return NextResponse.json({ error: `Backend error: ${backendResponse.statusText}` }, { status: backendResponse.status });
    }

    const data = await backendResponse.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[API Route] Error in crawl route:', error);
    return NextResponse.json({ error: error.message || 'An unexpected error occurred' }, { status: 500 });
  }
}
