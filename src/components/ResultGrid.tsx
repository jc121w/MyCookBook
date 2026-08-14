import { EdamamSearchResponse } from "@/app/types";
import { RecipeCardSkeleton } from "./recipes/RecipeCardSkeleton";
import { RecipeCard } from "./recipes/RecipeCard";

export const ResultsGrid = ({
  isLoading,
  error,
  hasQuery,
  hits,
}: {
  isLoading: boolean;
  error: unknown;
  hasQuery: boolean;
  hits?: EdamamSearchResponse["hits"];
}) => {
  const grid =
    "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

  // Before the user has searched — invite, don't show emptiness
  if (!hasQuery) {
    return (
      <div className="text-base-content/50 py-20 text-center">
        Start by searching for a dish or ingredient above.
      </div>
    );
  }

  // Loading — skeletons that match the card shape feel far better than "Loading…"
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
      <div className="text-base-content/50 py-20 text-center">
        No recipes found. Try a different search.
      </div>
    );
  }

  return (
    <div className={grid}>
      {hits.map((hit) => (
        <RecipeCard key={hit.recipe.uri} recipe={hit.recipe} />
      ))}
    </div>
  );
};
