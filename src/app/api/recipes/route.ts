import { NextRequest, NextResponse } from "next/server";

const BASE_URL = "https://api.edamam.com/api/recipes/v2";

export async function GET(request: NextRequest) {
  // Get the params from the get request to use in the api call
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  // Check if query is valid

  if (!query) {
    return NextResponse.json(
      { error: "Search query is required" },
      { status: 400 },
    );
  }
  // Actual API Call
  const url = new URL(BASE_URL);

  // Retrieve Filters
  const diet = searchParams.get("diet");
  const mealType = searchParams.get("mealType");
  const health = searchParams.get("health");
  const ingredients = searchParams.get("ingredients");

  // Set Paramaters
  url.searchParams.set("type", "public");
  url.searchParams.set("q", query);
  url.searchParams.set("app_id", process.env.EDAMAM_APP_ID!);
  url.searchParams.set("app_key", process.env.EDAMAM_APP_KEY!);

  console.log(url.toString());
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
        { status: 400 },
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
