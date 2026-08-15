import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { extractRecipeId } from "@/lib/utils/recipe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
// eslint-disable-next-line @typescript-eslint/no-explicit-any

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session)
      return NextResponse.json(
        { message: "Could Not Retrieve User Session" },
        { status: 401 },
      );
    const userId = session.user.id;

    const recipes = await prisma.recipe.findMany({
      where: {
        userId: userId,
      },
    });
    return NextResponse.json(recipes, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Could Not Fetch Recipes" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session)
      return NextResponse.json(
        { message: "Could Not Retrieve User Session" },
        { status: 401 },
      );
    const body = await req.json();
    const edamamId = extractRecipeId(body.uri);
    const userId = session.user.id;
    const recipeData = {
      label: body.label,
      image: body.image,
      source: body.source,
      url: body.url,
      yield: body.yield,
      calories: body.calories,
      totalTime: body.totalTime,
      dietLabels: body.dietLabels,
      healthLabels: body.healthLabels,
      ingredientLines: body.ingredientLines,
      cuisineType: body.cuisineType,
      mealType: body.mealType,
      dishType: body.dishType,
      totalNutrients: body.totalNutrients, // Json — object passed straight through
      raw: body,
    }; // Json — store the}
    const saved = await prisma.recipe.upsert({
      where: { userId_edamamId: { userId, edamamId } },
      update: recipeData,
      create: {
        userId,
        edamamId,
        ...recipeData,
      },
    });

    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    console.error("POST /api failed:", error);
    return NextResponse.json(
      { message: "Could Not Add Recipe" },
      { status: 500 },
    );
  }
}
