import { NextResponse } from "next/server"
import type { DataField } from "@/types/web-source"

export async function POST(request: Request) {
  try {
    const { name, url, dataFields } = await request.json();

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }
    if (!dataFields || !Array.isArray(dataFields) || dataFields.length === 0) {
      return NextResponse.json({ error: "At least one data field is required" }, { status: 400 });
    }

    // Validate fields
    const invalidFields = dataFields.filter((field: DataField) => !field.name || !field.rule);
    if (invalidFields.length > 0) {
      return NextResponse.json(
        {
          error: "All fields must have a name and extraction rule",
          invalidFields,
        },
        { status: 400 },
      );
    }

    const backendUrl = process.env.BACKEND_URL || "http://localhost:8081";
    const backendResponse = await fetch(`${backendUrl}/sources/add/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        url,
        data_fields: dataFields.map((field: any) => ({
          name: field.name,
          type: field.dataType,
          method: field.extractionMethod,
          rule: field.extractionRule,
        })),
      }),
    });

    // Handle duplicate (already registered) web source
    if (backendResponse.status === 409) {
      const data = await backendResponse.json();
      if (data.detail === "이미 등록된 웹소스입니다.") {
        // Fetch the latest web sources list
        const listRes = await fetch(`${backendUrl}/sources/list`);
        const listData = await listRes.json();
        return NextResponse.json({
          error: data.detail,
          alreadyExists: true,
          webSources: listData,
        }, { status: 409 });
      }
      // Other 409 error
      return NextResponse.json(data, { status: 409 });
    }
    const data = await backendResponse.json();
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error("Error saving web source:", error);
    return NextResponse.json({ error: "Failed to save web source configuration" }, { status: 500 });
  }
}

