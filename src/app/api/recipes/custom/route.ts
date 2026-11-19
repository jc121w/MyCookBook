import { auth } from "@/lib/auth";
import { cleanFileKey } from "@/lib/uploadthingServer";
import prisma from "@/lib/db";
import { CUISINE_TYPES, DISH_TYPES, MEAL_TYPES } from "@/lib/recipeOptions";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

// ── Small validators: turn untrusted JSON into exactly the shape we store ──

// A list of non-empty, trimmed strings (anything else is dropped)
function stringList(
  value: unknown,
  maxItems = 100,
  maxLength = 1000,
): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is string => typeof v === "string")
    .map((v) => v.trim().slice(0, maxLength))
    .filter(Boolean)
    .slice(0, maxItems);
}

// A whole number ≥ min, or the fallback
function wholeNumber(value: unknown, min: number, fallback: number): number {
  const n = Number(value);
  return Number.isInteger(n) && n >= min ? n : fallback;
}

// One value from an allowed list, stored as a 1-item array (Edamam's shape), or []
function oneOf(value: unknown, allowed: readonly string[]): string[] {
  return typeof value === "string" && allowed.includes(value) ? [value] : [];
}

const httpsUrl = (value: unknown) =>
  typeof value === "string" && value.startsWith("https://") ? value : null;

// POST /api/recipes/custom → create a recipe the user wrote themselves
export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body)
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const label = typeof body.label === "string" ? body.label.trim() : "";
  if (!label)
    return NextResponse.json(
      { error: "A recipe name is required" },
      { status: 400 },
    );
  if (label.length > 200)
    return NextResponse.json(
      { error: "That name is too long" },
      { status: 400 },
    );

  const servings = wholeNumber(body.yield, 1, 1);
  const caloriesPerServing = Number(body.caloriesPerServing);

  // Pick every field explicitly — never spread `body` into the database (mass assignment)
  const data = {
    userId: session.user.id,
    label,
    source:
      typeof body.source === "string" ? body.source.trim().slice(0, 200) : "",
    yield: servings,
    totalTime: wholeNumber(body.totalTime, 0, 0),
    // Stored as the WHOLE recipe's calories, like Edamam, so per-serving math works everywhere
    calories:
      Number.isFinite(caloriesPerServing) && caloriesPerServing >= 0
        ? caloriesPerServing * servings
        : null,
    image: httpsUrl(body.image),
    imageKey: httpsUrl(body.image) ? cleanFileKey(body.imageKey) : null, // lets us delete the file later
    url: httpsUrl(body.url),
    ingredientLines: stringList(body.ingredientLines),
    instructions: stringList(body.instructions, 50, 2000),
    dishType: oneOf(body.dishType, DISH_TYPES),
    cuisineType: oneOf(body.cuisineType, CUISINE_TYPES),
    mealType: oneOf(body.mealType, MEAL_TYPES),
  };

  try {
    const saved = await prisma.recipe.create({ data });
    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    console.error("POST /api/recipes/custom failed:", error);
    return NextResponse.json(
      { error: "Could not save the recipe" },
      { status: 500 },
    );
  }
}
