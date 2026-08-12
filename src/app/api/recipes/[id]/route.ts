import { NextRequest, NextResponse } from "next/server";

const BASE_URL = "https://api.edamam.com/api/recipes/v2";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const url = new URL(`${BASE_URL}/${id}`);
  url.searchParams.set("type", "public");
  url.searchParams.set("app_id", process.env.EDAMAM_APP_ID!);
  url.searchParams.set("app_key", process.env.EDAMAM_APP_KEY!);

  try {
    const res = await fetch(url.toString(), {
      headers: {
        "Edamam-Account-User": process.env.EDAMAM_USER_ID!,
      },
    });

    if (!res.ok) {
      console.error("Edamam error body:", await res.text());
      return NextResponse.json(
        { error: `Edamam API error: ${res.status} ${res.statusText}` },
        { status: res.status },
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to reach Edamam" },
      { status: 500 },
    );
  }
}
