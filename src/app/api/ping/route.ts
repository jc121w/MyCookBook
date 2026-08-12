import { NextResponse } from "next/server";
export async function GET(request: Request) {
  return NextResponse.json(
    { message: "pong", timestamp: new Date().toISOString() },
    { status: 200 },
  );
}
