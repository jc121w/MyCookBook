"use client";

import Link from "next/link";
import { Recipe } from "@/app/types";

function extractRecipeId(uri: string): string {
  // URI format: "http://www.edamam.com/ontologies/edamam.owl#recipe_abc123"
  return uri.split("#recipe_")[1] ?? uri;
}

export const RecipeCard = ({
  recipe,
}: {
  recipe: Recipe;
}) => {
  const recipeId = extractRecipeId(recipe.uri);

  const handleClick = () => {
    localStorage.setItem(`recipe_${recipeId}`, JSON.stringify(recipe));
  };

  return (
    <Link
      href={`/recipe/${recipeId}`}
      onClick={handleClick}
      className="card h-72 w-96 bg-base-300 shadow-sm transition-transform duration-200 hover:scale-105"
    >
      <figure className="h-32 shrink-0">
        <img src={recipe.image} alt={recipe.label} className="w-full object-cover" />
      </figure>
      <div className="card-body flex-1">
        <h2 className="card-title text-sm">
          {recipe.label}
        </h2>
        <div className="card-actions flex-wrap gap-1">
          <div className="badge badge-secondary">
            {Math.round(recipe.calories)} cal
          </div>
          {recipe.totalTime > 0 && (
            <div className="badge badge-outline">{recipe.totalTime} min</div>
          )}
          {recipe.cuisineType?.map((c) => (
            <div key={c} className="badge badge-outline capitalize">
              {c}
            </div>
          ))}
        </div>
      </div>
    </Link>
  );
};
