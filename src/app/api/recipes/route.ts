import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const recipes = await db.recipes.findMany();
    console.log(recipes);
    return NextResponse.json(recipes, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Could Not Fetch Recipes" },
      { status: 500 }
    );
  }
}
