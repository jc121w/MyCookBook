import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

const MAX_TAGS = 12;
const MAX_LENGTH = 30;

// PUT /api/library/:id/tags  { tags: ["Weeknight", "Holidays"] }
// Replaces the book's tags with the list sent (so removing a tag = sending the list without it).
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const recipeId = Number(id);
  if (!Number.isInteger(recipeId))
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const body = await req.json().catch(() => null);
  if (!body || !Array.isArray(body.tags))
    return NextResponse.json({ error: "tags must be a list" }, { status: 400 });

  // Clean up: trim, collapse spaces, drop empties, and drop duplicates ignoring case
  // ("weeknight" and "Weeknight" are the same tag; the first spelling wins)
  const tags: string[] = [];
  for (const raw of body.tags) {
    if (typeof raw !== "string") continue;
    const tag = raw.trim().replace(/\s+/g, " ");
    if (!tag) continue;
    if (tag.length > MAX_LENGTH)
      return NextResponse.json(
        { error: `Tags can be at most ${MAX_LENGTH} characters` },
        { status: 400 },
      );
    if (!tags.some((t) => t.toLowerCase() === tag.toLowerCase()))
      tags.push(tag);
  }
  if (tags.length > MAX_TAGS)
    return NextResponse.json(
      { error: `At most ${MAX_TAGS} tags per book` },
      { status: 400 },
    );

  // Only your own book (count 0 → not yours, or doesn't exist → 404)
  const { count } = await prisma.recipe.updateMany({
    where: { id: recipeId, userId: session.user.id },
    data: { tags },
  });
  if (count === 0)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ id: recipeId, tags });
}
