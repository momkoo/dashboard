// frontend/app/api/web-source/list/route.ts
import { NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8082';

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/sources/list`);
    
    if (!res.ok) {
      throw new Error(`Backend responded with ${res.status}: ${res.statusText}`);
    }
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[API Route] Error fetching web sources:', error);
    return NextResponse.json(
      { error: 'Failed to fetch web sources', details: error.message }, 
      { status: 500 }
    );
  }
}