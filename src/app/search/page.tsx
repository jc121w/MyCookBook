"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ResultsGrid } from "@/components/ResultGrid";
import {
  DIET_FILTERS,
  MEAL_FILTERS,
  PAGE_SIZE,
  searchRecipes,
  type SearchFilters,
} from "@/lib/edamam";
import { CUISINE_TYPES, titleCase } from "@/lib/recipeOptions";

// Ideas shown before the first search
const SUGGESTIONS = [
  "Chicken curry",
  "Pasta",
  "Tacos",
  "Banana bread",
  "Ramen",
  "Salmon",
  "Soup",
  "Salad",
];

// useSearchParams needs a Suspense boundary in the App Router
export default function SearchPage() {
  return (
    <Suspense>
      <RecipeSearch />
    </Suspense>
  );
}

function RecipeSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  // Everything about the search lives in the URL, so refresh, back and sharing all work:
  //   /search?q=curry&meal=Dinner&cuisine=Indian&diet=high-protein&page=2
  const query = params.get("q")?.trim() ?? "";
  const filters: SearchFilters = {
    mealType: params.get("meal") ?? undefined,
    cuisineType: params.get("cuisine") ?? undefined,
    diet: params.get("diet") ?? undefined,
  };
  const page = Math.max(1, Number(params.get("page")) || 1);

  const [text, setText] = useState(query);
  // keep the box in sync on back/forward
  useEffect(() => {
    setText(query);
  }, [query]);

  // Update some URL params; any change except the page itself goes back to page 1
  function setParams(changes: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    if (!("page" in changes)) next.delete("page");
    router.push(`${pathname}?${next.toString()}`);
  }

  // Edamam pages with "next page" tokens, so pages must be fetched in order.
  // useInfiniteQuery keeps every page it has fetched; page N is pages[N - 1].
  const results = useInfiniteQuery({
    queryKey: ["search", query, filters],
    queryFn: ({ pageParam }) => searchRecipes(query, filters, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.next ?? undefined,
    enabled: query !== "",
    staleTime: 10 * 60 * 1000,
  });

  const pages = results.data?.pages ?? [];
  const current = pages[page - 1];
  const total = pages[0]?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Asked for a page we haven't fetched yet (Next, or a page=3 link): fetch up to it
  useEffect(() => {
    if (
      pages.length > 0 &&
      pages.length < page &&
      results.hasNextPage &&
      !results.isFetchingNextPage
    ) {
      results.fetchNextPage();
    }
  }, [page, pages.length, results]);

  // New page → back to the top of the results
  // (Block body on purpose: an effect may only return a cleanup function, and
  // window.scrollTo returns a Promise in newer browsers.)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

  const hasNext = page < pages.length || results.hasNextPage;
  const activeFilters = Object.values(filters).filter(Boolean).length;

  return (
    <div>
      <section className="pb-8">
        <div className="text-center">
          <h1 className="font-serif text-4xl font-bold tracking-tight">
            Find a recipe
          </h1>
          <p className="text-base-content/60 mt-2">
            Search by dish or ingredient, then add the ones you cook to your
            shelf.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setParams({ q: text.trim() || null });
          }}
          className="mx-auto mt-6 flex w-full max-w-xl gap-2"
        >
          <label className="input input-lg flex flex-1 items-center gap-2">
            <Search className="h-5 w-5 opacity-50" />
            <input
              type="search"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="grow"
              aria-label="Search recipes"
            />
          </label>
          <button type="submit" className="btn btn-primary btn-lg">
            Search
          </button>
        </form>

        {/* Filters: compact selects, applied immediately */}
        <div className="mx-auto mt-4 flex max-w-xl flex-wrap items-center justify-center gap-2">
          <FilterSelect
            label="Meal"
            value={filters.mealType}
            options={MEAL_FILTERS.map((m) => ({ value: m, label: m }))}
            onChange={(v) => setParams({ meal: v })}
          />
          <FilterSelect
            label="Cuisine"
            value={filters.cuisineType}
            options={CUISINE_TYPES.map((c) => ({
              value: titleCase(c),
              label: titleCase(c),
            }))}
            onChange={(v) => setParams({ cuisine: v })}
          />
          <FilterSelect
            label="Diet"
            value={filters.diet}
            options={DIET_FILTERS}
            onChange={(v) => setParams({ diet: v })}
          />
          {activeFilters > 0 && (
            <button
              type="button"
              className="btn btn-ghost btn-sm gap-1"
              onClick={() =>
                setParams({ meal: null, cuisine: null, diet: null })
              }
            >
              <X className="h-3.5 w-3.5" /> Clear filters
            </button>
          )}
        </div>
      </section>

      <section>
        {query === "" ? (
          // Before searching: ideas, not an empty page
          <div className="py-12 text-center">
            <p className="font-serif text-lg italic opacity-70">
              Not sure what to cook?
            </p>
            <div className="mx-auto mt-4 flex max-w-xl flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  className="btn btn-sm btn-outline rounded-full font-normal"
                  onClick={() => setParams({ q: s })}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Summary line */}
            {total > 0 && (
              <p className="text-base-content/60 mb-5 text-sm">
                <span className="text-base-content font-semibold">
                  {total.toLocaleString()}
                </span>{" "}
                recipes for &ldquo;{query}&rdquo; · page {page} of{" "}
                {totalPages.toLocaleString()}
              </p>
            )}

            <ResultsGrid
              isLoading={results.isLoading || (!current && results.isFetching)}
              error={results.error}
              hits={current?.hits}
            />

            {/* Pagination */}
            {total > PAGE_SIZE && (
              <nav
                aria-label="Pages"
                className="mt-10 flex items-center justify-center gap-3"
              >
                <button
                  className="btn btn-outline gap-1"
                  disabled={page <= 1}
                  onClick={() =>
                    setParams({ page: page - 1 > 1 ? String(page - 1) : null })
                  }
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </button>
                <span className="min-w-[7rem] text-center text-sm tabular-nums opacity-70">
                  Page {page} of {totalPages.toLocaleString()}
                </span>
                <button
                  className="btn btn-outline gap-1"
                  disabled={!hasNext || results.isFetchingNextPage}
                  onClick={() => setParams({ page: String(page + 1) })}
                >
                  {results.isFetchingNextPage ? (
                    <span className="loading loading-spinner loading-xs" />
                  ) : null}
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              </nav>
            )}
          </>
        )}
      </section>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value?: string;
  options: { value: string; label: string }[];
  onChange: (value: string | null) => void;
}) {
  return (
    <select
      aria-label={label}
      className={`select select-sm w-auto ${value ? "select-primary" : ""}`}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value || null)}
    >
      <option value="">{label}: any</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
