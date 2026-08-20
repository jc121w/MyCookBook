"use client";

import Link from "next/link";
import { Recipe } from "@/app/types";
import { Clock, Flame } from "lucide-react";
import { extractRecipeId } from "@/lib/utils/recipe";
import { SaveButton } from "../SaveButton";

export const RecipeCard = ({ recipe }: { recipe: Recipe }) => {
  const recipeId = extractRecipeId(recipe.uri);

  const handleClick = () => {
    localStorage.setItem(`recipe_${recipeId}`, JSON.stringify(recipe));
  };
  console.log(recipe.image);
  return (
    <div className="group card bg-base-100 ring-base-300 h-full overflow-hidden shadow-sm ring-1 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl">
      <figure className="h-44 w-full overflow-hidden">
        <img
          src={recipe.image}
          alt={recipe.label}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </figure>

      <div className="card-body gap-3 p-5">
        <h2 className="card-title line-clamp-2 min-h-[3.5rem] text-lg leading-snug">
          {recipe.label}
        </h2>

        {/* Key stats — solid, subtle, always aligned to the bottom */}
        <div className="mt-auto flex flex-wrap items-center gap-2">
          <span className="badge badge-neutral gap-1">
            <Flame className="h-3 w-3" />
            {Math.round(recipe.calories)} cal
          </span>
          {recipe.totalTime > 0 && (
            <span className="badge badge-ghost gap-1">
              <Clock className="h-3 w-3" />
              {recipe.totalTime} min
            </span>
          )}
        </div>

        {/* Cuisine tags — quiet, capped so long lists don't overflow */}
        {recipe.cuisineType && recipe.cuisineType.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {recipe.cuisineType.slice(0, 2).map((c) => (
              <span
                key={c}
                className="badge badge-outline badge-sm capitalize opacity-70"
              >
                {c}
              </span>
            ))}
          </div>
        )}
      </div>
      <Link
        href={`/recipe/${recipeId}`}
        onClick={handleClick}
        aria-label={recipe.label}
        className="absolute inset-0 z-0"
      />
      <div
        className="absolute top-3 right-3 z-10"
        onClick={(e) => e.preventDefault()}
      >
        <SaveButton recipe={recipe} recipeid={recipeId} />
      </div>
    </div>
  );
};
