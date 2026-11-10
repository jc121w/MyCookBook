import { Recipe } from "@/app/types";

export function extractRecipeId(uri: string): string {
  return uri.split("#recipe_")[1] ?? uri;
}
export const grid =
  "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

export function perServing(recipe: Recipe, key: string): number {
  const total = recipe.totalNutrients[key]?.quantity ?? 0;
  return Math.round(total / recipe.yield);
}

// The "% Daily Value"
// that makes a nutrition panel actually meaningful. Same per-serving divide:
export function perServingDV(recipe: Recipe, key: string): number {
  const total = recipe.totalDaily[key]?.quantity ?? 0;
  return Math.round(total / recipe.yield);
}
