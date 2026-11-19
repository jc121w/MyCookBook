import type { SearchPage } from "@/lib/edamam";
import { extractRecipeId, grid } from "@/lib/utils/recipe";
import { AddToShelfButton } from "./AddToShelfButton";
import { RecipeCard } from "./recipes/RecipeCard";
import { RecipeCardSkeleton } from "./recipes/RecipeCardSkeleton";

// Results for one page of a search: skeletons while loading, then cards
export const ResultsGrid = ({
  isLoading,
  error,
  hits,
}: {
  isLoading: boolean;
  error: unknown;
  hits?: SearchPage["hits"];
}) => {
  if (isLoading) {
    return (
      <div className={grid}>
        {Array.from({ length: 8 }).map((_, i) => (
          <RecipeCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error mx-auto max-w-md">
        <span>Something went wrong loading recipes. Please try again.</span>
      </div>
    );
  }

  if (!hits || hits.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="font-serif text-lg">No recipes found.</p>
        <p className="text-base-content/60 mt-1 text-sm">
          Try a simpler search, or remove a filter.
        </p>
      </div>
    );
  }

  return (
    <div className={grid}>
      {hits.map(({ recipe }) => {
        const id = extractRecipeId(recipe.uri);
        return (
          <RecipeCard
            key={id}
            recipe={recipe}
            href={`/recipe/${id}`}
            // The detail page reads this instead of calling Edamam again
            onClick={() =>
              localStorage.setItem(`recipe_${id}`, JSON.stringify(recipe))
            }
            action={<AddToShelfButton recipe={recipe} edamamId={id} />}
          />
        );
      })}
    </div>
  );
};
