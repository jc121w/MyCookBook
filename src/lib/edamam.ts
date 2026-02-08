import axios from "axios";

const BASE_URL = "https://api.edamam.com/api/recipes/v2";

export interface RecipeFilters {
  diet?: string;
  health?: string[];
  mealType?: string;
  ingredients?: string;
}
export async function fetchRecipe(query: string, filters?: RecipeFilters) {
  const { data } = await axios.get("/api/recipes", {
    params: {
      q: query,
      ...filters,
    },
  });

  // Log the entire response
  console.log("Full data:", data);

  return data;
}
