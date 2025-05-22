import { NextResponse } from "next/server"

export async function GET() {
  const backendUrl = process.env.BACKEND_URL || "http://localhost:8081"
  const res = await fetch(`${backendUrl}/sources/list`)
  const data = await res.json()
  return NextResponse.json(data)
}
