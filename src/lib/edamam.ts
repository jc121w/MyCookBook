import axios from "axios";
import type { Recipe } from "@/app/types";

export type SearchFilters = {
  mealType?: string;
  cuisineType?: string;
  diet?: string;
};

// One page of results, as returned by our /api/recipes route
export type SearchPage = {
  count: number; // total matches across all pages
  hits: { recipe: Recipe }[];
  next: string | null; // token for the following page, null on the last page
};

export const PAGE_SIZE = 20; // Edamam returns 20 recipes per page

export async function searchRecipes(
  query: string,
  filters: SearchFilters,
  page?: string,
): Promise<SearchPage> {
  const { data } = await axios.get<SearchPage>("/api/recipes", {
    params: { q: query, page, ...filters },
  });
  return data;
}

// Filter options. Values are Edamam's own, so they can be sent as-is.
export const MEAL_FILTERS = [
  "Breakfast",
  "Lunch",
  "Dinner",
  "Snack",
  "Teatime",
];
export const DIET_FILTERS = [
  { value: "balanced", label: "Balanced" },
  { value: "high-protein", label: "High protein" },
  { value: "high-fiber", label: "High fiber" },
  { value: "low-carb", label: "Low carb" },
  { value: "low-fat", label: "Low fat" },
  { value: "low-sodium", label: "Low sodium" },
];
