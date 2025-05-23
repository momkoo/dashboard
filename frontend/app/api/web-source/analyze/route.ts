// frontend/app/api/web-source/analyze/route.ts
import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8082';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    console.log(`[API Route] Received URL from frontend: ${url}`);

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Forward the request to the backend
    const backendResponse = await fetch(`${BACKEND_URL}/sources/add/initial`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    if (!backendResponse.ok) {
      const errorBody = await backendResponse.text();
      console.error(`[API Route] Backend error response: ${backendResponse.status} - ${errorBody}`);
      return NextResponse.json(
        { error: `Backend error: ${backendResponse.statusText}` }, 
        { status: backendResponse.status }
      );
    }

    const data = await backendResponse.json();
    console.log(`[API Route] Successfully received data from backend for URL ${url}`);
    
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('[API Route] Error in analyze route:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' }, 
      { status: 500 }
    );
  }
}