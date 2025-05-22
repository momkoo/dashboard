// src/dashboard/frontend/app/api/web-source/analyze/route.ts
import { NextResponse } from 'next/server';

// Define the backend URL (assuming it runs on localhost:8000)
const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8081';

export async function POST(request: Request) {
  try {
    const { url } = await request.json(); // Get the URL from the frontend request body
    console.log(`[API Route] Received URL from frontend: ${url}`); // Log received URL

    // Forward the request to the backend FastAPI endpoint
    const backendResponse = await fetch(`${BACKEND_URL}/sources/add/initial`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // Ensure the received URL is sent in the backend request body
      body: JSON.stringify({ url: url }), // <-- Sending the received URL to backend
    });

    if (!backendResponse.ok) {
      const errorBody = await backendResponse.text();
      console.error(`[API Route] Backend error response: ${backendResponse.status} - ${errorBody}`);
      return NextResponse.json({ error: `Backend error: ${backendResponse.statusText}` }, { status: backendResponse.status });
    }

    const data = await backendResponse.json();
    console.log(`[API Route] Received data from backend for URL ${url}`); // Log successful backend response
    
    // Check if this is a Puppeteer fallback response
    if (data.screenshot && data.screenshot.includes('PUPPETEER_FALLBACK_URL:')) {
      console.log('[API Route] Detected Puppeteer fallback response');
      
      // Extract the URL from the fallback message
      const fallbackUrl = data.screenshot.split('PUPPETEER_FALLBACK_URL:')[1];
      console.log(`[API Route] Fallback URL: ${fallbackUrl}`);
      
      // Here we would normally use client-side Puppeteer to take a screenshot
      // Since we can't do that in the API route, we'll create a special response
      // that the frontend can detect and handle appropriately
      return NextResponse.json({
        puppeteerFallback: true,
        targetUrl: fallbackUrl,
        screenshot: '', // Empty screenshot - will be taken on client side
        dom_info: [] // Empty DOM info - will be processed on client side
      });
    }
    
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('[API Route] Error in analyze route:', error);
    return NextResponse.json({ error: error.message || 'An unexpected error occurred' }, { status: 500 });
  }
}
