import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ edamamId: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session)
      return NextResponse.json(
        { message: "Could Not Retrieve User Session" },
        { status: 401 },
      );
    const { edamamId } = await params;
    const userId = session.user.id;
    const recipe = await prisma.recipe.findUnique({
      where: {
        userId_edamamId: { userId, edamamId },
      },
    });

    if (recipe === null) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }
    return NextResponse.json(recipe, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Could not fetch recipe from database" },
      { status: 500 },
    );
  }
}
