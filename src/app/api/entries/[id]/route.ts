import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { cleanFileKey, deleteUnusedFiles } from "@/lib/uploadthingServer";
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

// PATCH /api/entries/:id  { rating?, notes?, cookedOn? } → update any of these
// (only the fields you send change; rating: null clears it)
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
  if (!body || typeof body !== "object")
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  // Build the update from only the fields that were sent, validating each
  const data: {
    rating?: number | null;
    notes?: string | null;
    cookedOn?: Date;
    photoUrl?: string | null;
    photoKey?: string | null;
  } = {};

  if ("rating" in body) {
    if (body.rating === null) data.rating = null;
    else {
      const n = Number(body.rating);
      if (!Number.isFinite(n) || n < 0.1 || n > 5)
        return NextResponse.json(
          { error: "Rating must be 0.1–5" },
          { status: 400 },
        );
      data.rating = Math.round(n * 10) / 10;
    }
  }

  if ("notes" in body) {
    const notes = typeof body.notes === "string" ? body.notes.trim() : "";
    if (notes.length > 5000)
      return NextResponse.json(
        { error: "Notes are too long" },
        { status: 400 },
      );
    data.notes = notes || null;
  }

  if ("cookedOn" in body) {
    // "2026-11-15" → midnight UTC, which matches the @db.Date column
    if (
      typeof body.cookedOn !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(body.cookedOn)
    )
      return NextResponse.json(
        { error: "cookedOn must be YYYY-MM-DD" },
        { status: 400 },
      );
    const date = new Date(body.cookedOn);
    if (Number.isNaN(date.getTime()))
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    data.cookedOn = date;
  }

  if ("photoUrl" in body) {
    // A new photo (its UploadThing URL + key), or null to remove the photo
    if (body.photoUrl === null) {
      data.photoUrl = null;
      data.photoKey = null;
    } else if (
      typeof body.photoUrl === "string" &&
      body.photoUrl.startsWith("https://")
    ) {
      data.photoUrl = body.photoUrl;
      data.photoKey = cleanFileKey(body.photoKey);
    } else {
      return NextResponse.json({ error: "Invalid photo URL" }, { status: 400 });
    }
  }

  if (Object.keys(data).length === 0)
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

  // Ownership through the recipe (an entry has no userId). Someone else's → 404.
  // We also need the current photo, to clean it up if it's being replaced.
  const existing = await prisma.recipeEntry.findFirst({
    where: { id: entryId, recipe: { userId: session.user.id } },
    select: { id: true, photoUrl: true, photoKey: true },
  });
  if (!existing)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.recipeEntry.update({
    where: { id: existing.id },
    data,
  });

  // Photo replaced or removed → delete the old file (if it was ours and nothing else uses it)
  if (
    "photoUrl" in data &&
    existing.photoUrl &&
    existing.photoUrl !== updated.photoUrl
  ) {
    await deleteUnusedFiles([
      { key: existing.photoKey, url: existing.photoUrl },
    ]);
  }

  return NextResponse.json(updated);
}
