import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/; // what <input type="date"> sends: "2026-11-15"

// POST /api/entries  { recipeId, cookedOn, notes?, photoUrl? }
export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  // ── Validate each field we accept (and ignore everything else) ──
  const recipeId = Number(body.recipeId);
  if (!Number.isInteger(recipeId))
    return NextResponse.json({ error: "Invalid recipeId" }, { status: 400 });

  if (typeof body.cookedOn !== "string" || !DATE_ONLY.test(body.cookedOn))
    return NextResponse.json({ error: "cookedOn must be YYYY-MM-DD" }, { status: 400 });
  const cookedOn = new Date(body.cookedOn); // "2026-11-15" → midnight UTC, matches @db.Date
  if (Number.isNaN(cookedOn.getTime()))
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });

  const notes =
    typeof body.notes === "string" && body.notes.trim() !== "" ? body.notes.trim() : null;
  if (notes && notes.length > 5000)
    return NextResponse.json({ error: "Notes are too long" }, { status: 400 });

  const photoUrl = typeof body.photoUrl === "string" ? body.photoUrl : null;
  if (photoUrl && !photoUrl.startsWith("https://"))
    return NextResponse.json({ error: "Invalid photo URL" }, { status: 400 });

  // ── Ownership: the client sent a recipeId; make sure it's this user's book ──
  const recipe = await prisma.recipe.findFirst({
    where: { id: recipeId, userId: session.user.id },
    select: { id: true },
  });
  if (!recipe) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const entry = await prisma.recipeEntry.create({
      data: { recipeId, cookedOn, notes, photoUrl },
    });
    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error("POST /api/entries failed:", error);
    return NextResponse.json({ error: "Could not save entry" }, { status: 500 });
  }
}
