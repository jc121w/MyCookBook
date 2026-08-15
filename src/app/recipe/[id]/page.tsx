"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { useParams } from "next/navigation";
import { BackButton } from "@/components/BackButton";
import { Recipe } from "@/app/types";
import { ExternalLink } from "lucide-react";
import axios from "axios";
import RedirectMessage from "@/components/form/RedirectMessage";

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

function getNutrient(recipe: Recipe, key: string): number {
  return Math.round(recipe.totalNutrients[key]?.quantity ?? 0);
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

  if (isLoading) {
    return (
      <div className="mt-10 text-center text-3xl font-semibold">Loading...</div>
    );
  }

  if (error || !recipe) {
    <RedirectMessage {...error} />;
  }

  return (
    <div className="max-w-4xl">
      <BackButton />

      {/* Header */}
      <div className="mt-6 flex flex-col items-start gap-8 xl:flex-row">
        <div className="shrink-0">
          <h1 className="py-5 text-2xl font-bold text-pretty">
            {recipe.label}
          </h1>
          <Image
            src={recipe.image}
            alt={recipe.label}
            width={500}
            height={350}
            className="rounded-lg"
          />
        </div>

        {/* Quick stats */}
        <div className="flex flex-col gap-3 py-6">
          <div className="flex flex-wrap gap-3">
            <span className="badge badge-lg">Serves: {recipe.yield}</span>
            {recipe.totalTime > 0 && (
              <span className="badge badge-lg">
                Time: {recipe.totalTime} min
              </span>
            )}
            <span className="badge badge-secondary badge-lg">
              {Math.round(recipe.calories)} cal
            </span>
            <span className="badge badge-lg">
              Protein: {getNutrient(recipe, "PROCNT")}g
            </span>
            <span className="badge badge-lg">
              Fat: {getNutrient(recipe, "FAT")}g
            </span>
            <span className="badge badge-lg">
              Carbs: {getNutrient(recipe, "CHOCDF")}g
            </span>
            <span className="badge badge-lg">
              Sugar: {getNutrient(recipe, "SUGAR")}g
            </span>
            <span className="badge badge-lg">
              Fiber: {getNutrient(recipe, "FIBTG")}g
            </span>
          </div>

          {/* Labels */}
          <div className="flex flex-wrap gap-2">
            {recipe.dietLabels.map((label) => (
              <span key={label} className="badge badge-accent">
                {label}
              </span>
            ))}
            {recipe.healthLabels.slice(0, 6).map((label) => (
              <span key={label} className="badge badge-outline">
                {label}
              </span>
            ))}
          </div>

          {/* Cuisine / Meal / Dish type */}
          <div className="flex flex-wrap gap-2 text-sm opacity-70">
            {recipe.cuisineType?.map((c) => (
              <span key={c} className="capitalize">
                {c}
              </span>
            ))}
            {recipe.mealType?.map((m) => (
              <span key={m} className="capitalize">
                · {m}
              </span>
            ))}
            {recipe.dishType?.map((d) => (
              <span key={d} className="capitalize">
                · {d}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Ingredients */}
      <h2 className="py-5 text-2xl font-semibold">Ingredients</h2>
      <ul className="flex flex-col gap-2">
        {recipe.ingredientLines.map((line, i) => (
          <li key={i} className="bg-base-200 rounded-lg border p-3">
            {line}
          </li>
        ))}
      </ul>

      {/* Instructions link */}
      <div className="my-10">
        <a
          href={recipe.url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary gap-2"
        >
          <ExternalLink size={18} />
          View Full Instructions on {recipe.source}
        </a>
        <p className="mt-2 text-sm opacity-60">
          Edamam provides ingredients and nutrition — full cooking instructions
          are on the original recipe site.
        </p>
      </div>

      {/* Full Nutrition */}
      <h2 className="py-5 text-2xl font-semibold">Nutrition Facts</h2>
      <div className="mb-10 grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
        {Object.entries(recipe.totalNutrients).map(([key, nutrient]) => (
          <div key={key} className="bg-base-200 rounded-lg border p-2 text-sm">
            <span className="font-medium">{nutrient.label}</span>
            <br />
            {Math.round(nutrient.quantity)} {nutrient.unit}
          </div>
        ))}
      </div>
    </div>
  );
}
