import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { parseRecipeInput } from "@/lib/recipeInput";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

// POST /api/recipes/custom → create a recipe the user wrote themselves
export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Every field is picked and checked explicitly (never spread the body into the database)
  const parsed = parseRecipeInput(await req.json().catch(() => null));
  if (!parsed.ok)
    return NextResponse.json({ error: parsed.error }, { status: 400 });

  try {
    const saved = await prisma.recipe.create({
      data: { userId: session.user.id, ...parsed.data },
    });
    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    console.error("POST /api/recipes/custom failed:", error);
    return NextResponse.json(
      { error: "Could not save the recipe" },
      { status: 500 },
    );
  }
}
