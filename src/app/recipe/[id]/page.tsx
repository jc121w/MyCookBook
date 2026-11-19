"use client";

import { Recipe } from "@/app/types";
import { RecipeDetail } from "@/components/recipes/RecipeDetail";
import { RecipeDetailSkeleton } from "@/components/recipes/RecipeDetailSkeleton";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useParams } from "next/navigation";

async function fetchRecipeById(id: string): Promise<Recipe> {
  // Try localStorage first (set when clicking a RecipeCard)
  const cached = localStorage.getItem(`recipe_${id}`);
  if (cached) {
    return JSON.parse(cached);
  }

  // Fallback: fetch from Edamam via our API route
  const { data } = await axios.get(`/api/recipes/${id}`);
  return data.recipe;
}
export default function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const {
    data: recipe,
    isLoading,
    error,
  } = useQuery<Recipe>({
    queryKey: ["recipe", id],
    queryFn: () => fetchRecipeById(id),
    enabled: !!id,
  });

  if (isLoading) return <RecipeDetailSkeleton />;
  if (error || !recipe)
    return (
      <div className="mx-auto max-w-4xl">
        <div className="alert alert-error mt-10">
          <span>Couldn't load this recipe.</span>
        </div>
      </div>
    );

  const heroImage =
    recipe.images?.REGULAR?.url ?? recipe.images?.LARGE?.url ?? recipe.image;

  return <RecipeDetail recipe={{ ...recipe, image: heroImage }} />;
}
