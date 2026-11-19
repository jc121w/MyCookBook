import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }, // name matches the [id] folder
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const recipeId = Number(id);
  if (Number.isNaN(recipeId))
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const recipe = await prisma.recipe.findFirst({
    where: { id: recipeId, userId: session.user.id }, // only if it's mine
    include: { entries: { orderBy: { cookedOn: "desc" } } }, // newest first
  });
  if (!recipe)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(recipe);
}
