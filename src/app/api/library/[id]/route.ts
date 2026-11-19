import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { deleteUnusedFiles } from "@/lib/uploadthingServer";
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

// DELETE /api/library/:id → delete a book, all its entries (cascade), and their photos
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const recipeId = Number(id);
  if (!Number.isInteger(recipeId))
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  // Grab the photo info BEFORE deleting: once the cascade runs, the entries are gone
  const recipe = await prisma.recipe.findFirst({
    where: { id: recipeId, userId: session.user.id },
    select: {
      id: true,
      image: true,
      imageKey: true,
      entries: { select: { photoKey: true, photoUrl: true } },
    },
  });
  if (!recipe)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  // onDelete: Cascade on RecipeEntry.recipe removes the entries with it
  await prisma.recipe.delete({ where: { id: recipe.id } });

  await deleteUnusedFiles([
    { key: recipe.imageKey, url: recipe.image },
    ...recipe.entries.map((e) => ({ key: e.photoKey, url: e.photoUrl })),
  ]);

  return new NextResponse(null, { status: 204 });
}
