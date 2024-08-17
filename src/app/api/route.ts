import prisma from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const recipes = await prisma.recipes.findMany();
    console.log("in the route", recipes);
    return NextResponse.json(recipes, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Could Not Fetch Recipes" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("in post", body);
    const ingredients =
      body.analyzedInstructions?.[0]?.steps?.[0]?.ingredients[0].name || [];
    console.log("Ingredients:", ingredients);

    const instructions = body.analyzedInstructions?.[0]?.steps?.[0]?.step || "";
    console.log("Instructions:", instructions);

    const recipes = await prisma.recipes.create({
      data: {
        id: body.id,
        name: body.title,
        src: body.image,
        calories: body.nutrition.nutrients[0].amount,
        description: body.summary,
        ingredients: ingredients,
        instructions: instructions,
      },
    });
    console.log(recipes);

    return NextResponse.json(recipes, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Could Not Add Recipe" },
      { status: 500 }
    );
  }
}
