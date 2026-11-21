"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { ArrowRight, ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { useNarrow } from "@/lib/useNarrow";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, useRef } from "react";
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
  const searchInput = useRef<HTMLInputElement>(null);
  const narrow = useNarrow();
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

        {/* One rounded field: icon, text, clear, and the Search button tucked inside */}
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            setParams({ q: text.trim() || null });
          }}
          className="group bg-base-200/60 hover:bg-base-200 focus-within:bg-base-100 focus-within:border-primary/50 focus-within:ring-primary/15 relative mx-auto mt-6 flex h-14 w-full max-w-xl items-center rounded-full border border-transparent pr-1.5 pl-5 transition-colors focus-within:ring-4"
        >
          <Search
            aria-hidden
            className="h-5 w-5 shrink-0 opacity-45 transition-opacity group-focus-within:opacity-80"
          />
          <input
            ref={searchInput}
            type="search"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape" && text) {
                e.preventDefault();
                setText("");
              }
            }}
            // The example only fits on wider screens
            placeholder={
              narrow ? "Search recipes" : "Try “chicken curry” or “pasta”"
            }
            aria-label="Search recipes"
            enterKeyHint="search"
            autoComplete="off"
            spellCheck={false}
            // The browser's own clear "×" is hidden: ours is below
            className="placeholder:text-base-content/45 h-full min-w-0 flex-1 bg-transparent px-3 text-base outline-none focus-visible:outline-none [&::-webkit-search-cancel-button]:appearance-none"
          />
          {text && (
            <button
              type="button"
              onClick={() => {
                setText("");
                setParams({ q: null }); // back to the ideas
                searchInput.current?.focus();
              }}
              aria-label="Clear search"
              className="hover:bg-base-content/10 mr-1 grid h-8 w-8 shrink-0 place-items-center rounded-full opacity-55 transition hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          {/* "Search" on wider screens; a round arrow on small phones, to leave room for typing */}
          <button
            type="submit"
            aria-label="Search"
            className="btn btn-primary h-11 min-h-0 w-11 shrink-0 rounded-full p-0 font-serif sm:w-auto sm:px-5"
          >
            <ArrowRight className="h-5 w-5 sm:hidden" aria-hidden />
            <span className="hidden sm:inline">Search</span>
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
              className="btn btn-ghost btn-sm h-8 min-h-0 gap-1 rounded-full text-xs font-normal"
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
                  className="border-base-content/15 hover:border-base-content/30 hover:bg-base-200/70 h-8 rounded-full border px-3.5 text-sm transition-colors"
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
              onRetry={() => results.refetch()}
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
                {/* Page numbers: the current one filled. Edamam only fetches pages in order,
                    so the numbers stop one past the furthest page loaded so far */}
                <div className="flex items-center gap-1">
                  {pageWindow(
                    page,
                    pages.length + (results.hasNextPage ? 1 : 0),
                    totalPages,
                  ).map((item, i) =>
                    item === "…" ? (
                      <span key={`gap-${i}`} className="px-1 opacity-40">
                        …
                      </span>
                    ) : item.reachable ? (
                      <button
                        key={item.n}
                        onClick={() =>
                          setParams({
                            page: item.n > 1 ? String(item.n) : null,
                          })
                        }
                        aria-current={item.n === page ? "page" : undefined}
                        className={`grid h-9 min-w-9 place-items-center rounded-full px-2 font-serif text-sm tabular-nums transition-colors ${
                          item.n === page
                            ? "bg-primary text-primary-content font-semibold shadow-sm"
                            : "hover:bg-base-200"
                        }`}
                      >
                        {item.n.toLocaleString()}
                      </button>
                    ) : (
                      // the last page: shown for scale, but can't be jumped to
                      <span
                        key={item.n}
                        className="px-1 font-serif text-sm tabular-nums opacity-40"
                      >
                        {item.n.toLocaleString()}
                      </span>
                    ),
                  )}
                </div>
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
            {total > PAGE_SIZE && (
              <p className="mt-3 text-center text-xs opacity-50">
                Page {page} of {totalPages.toLocaleString()}
              </p>
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
      // Pills, like the shelf's filter chips; filled in when a filter is on
      className={`select select-sm h-8 w-auto rounded-full text-xs ${
        value
          ? "bg-primary text-primary-content border-primary"
          : "border-base-content/15 hover:border-base-content/30 bg-base-100" // solid: the open list inherits this background
      }`}
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

// Which page numbers to show: a few around the current page, the first page, and the
// last page (for scale). `reachable` = how far we can jump (pages load in order).
//   pageWindow(6, 7, 500) → [1, "…", 4, 5, 6, 7, "…", 500]
function pageWindow(current: number, reachable: number, last: number) {
  const items: ({ n: number; reachable: boolean } | "…")[] = [];
  const from = Math.max(1, current - 2);
  const to = Math.min(Math.max(reachable, current), current + 2);
  if (from > 1) {
    items.push({ n: 1, reachable: true });
    if (from > 2) items.push("…");
  }
  for (let n = from; n <= to; n++) items.push({ n, reachable: true });
  if (last > to) {
    if (last > to + 1) items.push("…");
    items.push({ n: last, reachable: last <= reachable });
  }
  return items;
}
