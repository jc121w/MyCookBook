"use client";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { EdamamSearchResponse } from "../types";
import { fetchRecipe, RecipeFilters } from "@/lib/edamam";
import { ResultsGrid } from "@/components/ResultGrid";

export default function RecipesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("search") ?? "";
  const offset = Number(searchParams.get("offset")) ?? 0;
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<RecipeFilters>({});

  const { data, isLoading, error } = useQuery<EdamamSearchResponse>({
    queryKey: ["recipes", query, offset],
    queryFn: () => fetchRecipe(query, filters),
    enabled: !!query,
    staleTime: 4 * 60 * 1000,
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    router.push(`?search=${encodeURIComponent(search)}&offset=${offset}`);
  };

  return (
    <main className="bg-base-200 min-h-screen">
      {/* Header — gives the page an anchor */}
      <section className="bg-base-100">
        <div className="mx-auto max-w-6xl px-4 py-10 text-center">
          <h1 className="text-4xl font-bold tracking-tight">Find a recipe</h1>
          <p className="text-base-content/60 mt-2">
            Search thousands of recipes by ingredient, cuisine, or dish.
          </p>

          {/* DaisyUI 5 input pattern: icon + input live inside one .input */}
          <form
            onSubmit={handleSubmit}
            className="mx-auto mt-6 flex w-full max-w-md gap-2"
          >
            <label className="input-bordered input flex flex-1 items-center gap-2">
              <Search className="h-4 w-4 opacity-60" />
              <input
                type="text"
                name="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="e.g. chicken curry"
                className="grow"
              />
            </label>
            <button type="submit" className="btn btn-primary">
              Search
            </button>
          </form>
        </div>
      </section>

      {/* Results */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <ResultsGrid
          isLoading={isLoading}
          error={error}
          hasQuery={!!query}
          hits={data?.hits}
        />
      </section>
    </main>
  );
}
