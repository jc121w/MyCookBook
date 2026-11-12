"use client";

import { Recipe } from "@/app/types";
import { RecipeDetail } from "@/components/recipes/RecipeDetail";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useParams } from "next/navigation";

async function fetchRecipeById(id: string): Promise<Recipe> {
  // Try localStorage first (set when clicking a RecipeCard)
  const cached = localStorage.getItem(`recipe_${id}`);
  if (cached) {
    return JSON.parse(cached);
  }

  // Try PostgreSQL Database
  const saved = await axios.get(`/api/saved/${id}`);
  if (saved) {
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

  // if (isLoading) return <DetailSkeleton />;
  if (error || !recipe)
    return (
      <div className="mx-auto max-w-4xl px-4">
        <div className="alert alert-error mt-10">
          <span>Couldn't load this recipe.</span>
        </div>
      </div>
    );

  const heroImage =
    recipe.images?.REGULAR?.url ?? recipe.images?.LARGE?.url ?? recipe.image;

  return <RecipeDetail recipe={recipe} />;
}
