import prisma from "@/lib/db";
import { NextResponse } from "next/server";
import { Ingredient, Nutrient, Step } from "../types";

export async function GET() {
  try {
    const recipes = await prisma.recipe.findMany({
      include: { nutrients: true, ingredients: true, steps: true },
    });
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

    const recipes = await prisma.recipe.create({
      data: {
        id: body.id,
        title: body.title,
        image: body.image,
        cheap: body.cheap,
        readyInMinutes: body.readyInMinutes,
        servings: body.servings,
        summary: body.summary,
        nutrients: {
          create: body.nutrition.nutrients.map((currNutrient: Nutrient) => ({
            name: currNutrient.name,
            amount: currNutrient.amount,
            unit: currNutrient.unit,
          })),
        },
        ingredients: {
          create: body.nutrition.ingredients.map(
            (currIngredient: Ingredient) => ({
              name: currIngredient.name,
              amount: currIngredient.amount,
              unit: currIngredient.unit,
            })
          ),
        },
        steps: {
          create: body.analyzedInstructions[0].steps.map((currStep: Step) => ({
            number: currStep.number,
            step: currStep.step,
            stepIngredients: currStep.ingredients.map(
              (currStepIngredients: Ingredient) => currStepIngredients.name
            ),
          })),
        },
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
