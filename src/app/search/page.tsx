"use client";
import { RecipeCard } from "@/components/recipes/RecipeCard";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Search } from "lucide-react";
import { useState } from "react";

import { useRouter, useSearchParams } from "next/navigation";
import { EdamamSearchResponse } from "../types";
import { fetchRecipe, RecipeFilters } from "@/lib/edamam";

export default function RecipesPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const [filters, setFilters] = useState<RecipeFilters>({});
  const {
    data: data,
    isLoading: isLoadingRecipes,
    error: recipesError,
  } = useQuery<EdamamSearchResponse>({
    queryKey: ["recipes", query, offset],
    queryFn: () => fetchRecipe(query, filters),
    enabled: !!query,
  });

  if (isLoadingRecipes)
    return (
      <div className="mt-10 text-center text-3xl font-semibold">Loading...</div>
    );
  if (recipesError)
    return (
      <div className="prose mt-10 text-center text-3xl font-semibold text-red-600">
        Error loading recipes
      </div>
    );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setQuery(search);
    router.push(`?search=${query}&offset=${offset}`);
  };

  return (
    <main className="m-auto flex h-screen max-w-4xl flex-col items-center justify-start gap-10">
      <form
        onSubmit={handleSubmit}
        className="relative mt-8 flex h-12 w-80 items-center justify-between rounded-lg border"
      >
        <input
          type="text"
          name="search"
          onChange={(search) => setSearch(search.target.value)}
          className="block h-full w-full rounded-lg p-5"
          placeholder="Find a recipe"
        ></input>{" "}
        <button type="submit" className="absolute right-5">
          {" "}
          <Search />
        </button>
      </form>
      <div className="mt-10 grid h-fit w-full items-center justify-center gap-8 md:grid-cols-2 lg:grid-cols-3">
        {" "}
        {data?.hits?.length == 0 ? (
          <span className="prose text-2xl font-semibold"> No results</span>
        ) : (
          data?.hits.map((hit) => (
              <RecipeCard
                key={hit.recipe.uri}
                recipe={hit.recipe}
              />
          ))
        )}
      </div>
    </main>
  );
}
