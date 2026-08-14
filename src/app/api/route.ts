import prisma from "@/lib/db";
import { extractRecipeId } from "@/lib/utils/recipe";
import { NextResponse } from "next/server";
// eslint-disable-next-line @typescript-eslint/no-explicit-any

export async function GET() {
  try {
    const recipes = await prisma.recipe.findMany();
    console.log("in the route", recipes);
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
    const body = await req.json();
    const id = extractRecipeId(body.uri);
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
      where: { id },
      update: recipeData,
      create: {
        id,
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
