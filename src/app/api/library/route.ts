import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { copyEdamamImage } from "@/lib/uploadthingServer";
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
      include: {
        _count: { select: { entries: true } },
        // Just the cook dates and ratings (not notes or photos): the shelf's filters
        // ("cooked this month", "rated 4+") and "What should I cook?" use them
        entries: { select: { cookedOn: true, rating: true } },
      },
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

    // The picture. Edamam's link expires within an hour, so keep our own copy:
    //  - already on your shelf with a picture we host (copied before, or your own photo
    //    from editing it)? keep that one, and don't copy again
    //  - otherwise copy it into UploadThing; if that fails, fall back to Edamam's link
    //    so shelving still works (the picture just won't last)
    const existing = await prisma.recipe.findUnique({
      where: { userId_edamamId: { userId, edamamId } },
      select: { image: true, imageKey: true },
    });
    let image: { image: string | null; imageKey: string | null };
    if (existing?.imageKey) {
      image = { image: existing.image, imageKey: existing.imageKey };
    } else {
      const copy = await copyEdamamImage(body.image);
      image = copy
        ? { image: copy.url, imageKey: copy.key }
        : {
            image: typeof body.image === "string" ? body.image : null,
            imageKey: null,
          };
    }

    const recipeData = {
      label: body.label,
      ...image,
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
