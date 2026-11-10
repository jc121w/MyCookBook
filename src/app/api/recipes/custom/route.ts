import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { stat } from "fs";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session)
      return NextResponse.json(
        { message: "Could Not Retrieve User Session" },
        { status: 401 },
      );
    const body = await req.json();
    const userId = session.user.id;

    if (!body.label) {
      return NextResponse.json(
        { message: "Label not provided" },
        { status: 400 },
      );
    }

    const customRecipeInfo = {
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
    const saved = await prisma.recipe.create({
      data: { userId, ...customRecipeInfo },
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
