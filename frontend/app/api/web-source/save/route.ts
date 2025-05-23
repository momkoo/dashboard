// frontend/app/api/web-source/save/route.ts
import { NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8082';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, url, dataFields } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // dataFields를 data_fields로 변환
    const backendPayload = {
      name,
      url,
      data_fields: dataFields || [],
    };

    const backendResponse = await fetch(`${BACKEND_URL}/sources/add/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(backendPayload),
    });

    // Handle duplicate (already registered) web source
    if (backendResponse.status === 409) {
      const data = await backendResponse.json();
      if (data.detail === "이미 등록된 웹소스입니다.") {
        // Fetch the latest web sources list
        try {
          const listRes = await fetch(`${BACKEND_URL}/sources/list`);
          const listData = await listRes.json();
          return NextResponse.json({
            error: data.detail,
            alreadyExists: true,
            webSources: listData,
          }, { status: 409 });
        } catch (listError) {
          console.error('Error fetching web sources list:', listError);
        }
      }
      return NextResponse.json(data, { status: 409 });
    }

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json();
      return NextResponse.json(errorData, { status: backendResponse.status });
    }

    const data = await backendResponse.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("Error saving web source:", error);
    return NextResponse.json(
      { error: "Failed to save web source configuration", details: error.message }, 
      { status: 500 }
    );
  }
}