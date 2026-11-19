import { NextRequest, NextResponse } from "next/server";

const BASE_URL = "https://api.edamam.com/api/recipes/v2";

// GET /api/recipes?q=curry&page=<token>&mealType=Dinner&cuisineType=Indian&diet=high-protein
//
// Edamam pages with a cursor, not page numbers: each response links to the next page
// with a `_cont` token. We pass that token back to the client as `next`, and the
// client sends it as `page` to get the following page.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();
  if (!query) {
    return NextResponse.json(
      { error: "Search query is required" },
      { status: 400 },
    );
  }

  const url = new URL(BASE_URL);
  url.searchParams.set("type", "public");
  url.searchParams.set("q", query);
  url.searchParams.set("app_id", process.env.EDAMAM_APP_ID!);
  url.searchParams.set("app_key", process.env.EDAMAM_APP_KEY!);

  // Optional: the cursor for pages after the first, and filters (only known keys pass through)
  const page = searchParams.get("page");
  if (page) url.searchParams.set("_cont", page);
  for (const key of ["mealType", "cuisineType", "diet"] as const) {
    const value = searchParams.get(key);
    if (value) url.searchParams.set(key, value);
  }

  try {
    const res = await fetch(url.toString(), {
      headers: { "Edamam-Account-User": process.env.EDAMAM_USER_ID! },
      next: { revalidate: 600 }, // the same search within 10 minutes is served from cache
    });

    if (!res.ok) {
      console.error("Edamam error:", res.status, await res.text());
      const status = res.status === 429 ? 429 : 502; // 429 = Edamam's rate limit
      return NextResponse.json(
        {
          error:
            status === 429
              ? "Too many searches, wait a moment"
              : "Recipe search failed",
        },
        { status },
      );
    }

    const data = await res.json();
    const nextHref: string | undefined = data._links?.next?.href;

    return NextResponse.json({
      count: data.count as number, // total matches
      hits: data.hits, // [{ recipe }, ...] (20 per page)
      next: nextHref ? new URL(nextHref).searchParams.get("_cont") : null,
    });
  } catch (error) {
    console.error("Edamam unreachable:", error);
    return NextResponse.json(
      { error: "Couldn't reach the recipe service" },
      { status: 502 },
    );
  }
}
