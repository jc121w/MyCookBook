import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { deleteUnusedFiles } from "@/lib/uploadthingServer";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

// DELETE /api/entries/:id → delete one journal entry (and its photo)
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const entryId = Number(id);
  if (!Number.isInteger(entryId))
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  // Ownership through the relation: an entry has no userId, its recipe does.
  // Someone else's entry → not found (404), same as a missing one.
  const entry = await prisma.recipeEntry.findFirst({
    where: { id: entryId, recipe: { userId: session.user.id } },
    select: { id: true, photoKey: true, photoUrl: true },
  });
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.recipeEntry.delete({ where: { id: entry.id } });

  // Row first, file second: if the file cleanup fails, the user still sees the delete work
  await deleteUnusedFiles([{ key: entry.photoKey, url: entry.photoUrl }]);

  return new NextResponse(null, { status: 204 }); // 204 = success, nothing to send back
}

// PATCH /api/entries/:id  { rating } → update an entry's rating (null clears it)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const entryId = Number(id);
  if (!Number.isInteger(entryId))
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const body = await req.json().catch(() => null);
  if (!body || !("rating" in body))
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

  // 0.1–5.0, rounded to one decimal, or null to clear. Anything else is rejected.
  let rating: number | null = null;
  if (body.rating !== null) {
    const n = Number(body.rating);
    if (!Number.isFinite(n) || n < 0.1 || n > 5)
      return NextResponse.json(
        { error: "Rating must be 0.1–5" },
        { status: 400 },
      );
    rating = Math.round(n * 10) / 10;
  }

  // updateMany lets us filter by ownership (through the recipe) in the same query.
  // count 0 → the entry doesn't exist or isn't yours → 404.
  const { count } = await prisma.recipeEntry.updateMany({
    where: { id: entryId, recipe: { userId: session.user.id } },
    data: { rating },
  });
  if (count === 0)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ id: entryId, rating });
}
