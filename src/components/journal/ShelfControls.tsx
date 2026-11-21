"use client";

import { Search, Tag, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { BUILT_IN_FILTERS, type ShelfFilter } from "@/lib/shelf";
import { useNarrow } from "@/lib/useNarrow";

// The shelf's search field, with filter chips underneath.
//   "/" anywhere on the page jumps to the search; Escape clears it.
export function ShelfControls({
  query,
  onQuery,
  filter,
  onFilter,
  tags,
}: {
  query: string;
  onQuery: (q: string) => void;
  filter: ShelfFilter;
  onFilter: (f: ShelfFilter) => void;
  tags: string[];
}) {
  const input = useRef<HTMLInputElement>(null);
  const narrow = useNarrow(); // the long hint doesn't fit on small phones

  // "/" focuses the search (unless you're already typing somewhere)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement;
      if (target.closest("input, textarea, select, [contenteditable=true]"))
        return;
      if (document.querySelector("[role=dialog]")) return; // a book is open
      e.preventDefault();
      input.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="mb-4 flex w-full flex-col gap-3">
      {/* The search field: soft and rounded, icon on the left, clear (or the "/" hint) on the right */}
      <div className="group relative w-full sm:max-w-md">
        <Search
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 opacity-45 transition-opacity group-focus-within:opacity-80"
        />
        <input
          ref={input}
          type="search"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape" && query) {
              e.preventDefault();
              onQuery("");
            }
          }}
          placeholder={
            narrow ? "Search books" : "Search by name, source or tag"
          }
          aria-label="Search your shelf"
          enterKeyHint="search"
          autoComplete="off"
          spellCheck={false}
          // The browser's own clear "×" is hidden: ours is below (one, not two)
          className="bg-base-200/60 hover:bg-base-200 focus:bg-base-100 focus:border-primary/50 focus:ring-primary/15 placeholder:text-base-content/45 h-10 w-full rounded-full border border-transparent pr-10 pl-10 text-sm transition-colors outline-none focus:ring-4 focus-visible:outline-none [&::-webkit-search-cancel-button]:appearance-none"
        />
        {query ? (
          <button
            type="button"
            onClick={() => {
              onQuery("");
              input.current?.focus();
            }}
            aria-label="Clear search"
            className="hover:bg-base-content/10 absolute top-1/2 right-2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full opacity-55 transition hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>
        ) : (
          // Hint for keyboard users (hidden on touch screens, where there's no "/")
          <kbd
            aria-hidden
            className="border-base-content/15 pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 rounded border px-1.5 font-mono text-[11px] leading-5 opacity-50 group-focus-within:hidden [@media(hover:hover)]:block"
          >
            /
          </kbd>
        )}
      </div>

      {/* Filter chips: one at a time (tap again to clear). Your tags follow, after a
          small divider. Scrolls sideways on a phone. */}
      <div
        role="radiogroup"
        aria-label="Filter your shelf"
        className="-mx-1 flex [scrollbar-width:none] items-center gap-1.5 overflow-x-auto px-1 pb-1 [&::-webkit-scrollbar]:hidden"
      >
        {BUILT_IN_FILTERS.map((chip) => (
          <Chip
            key={chip.value}
            active={filter === chip.value}
            onClick={() => onFilter(filter === chip.value ? "all" : chip.value)}
          >
            {chip.label}
          </Chip>
        ))}
        {tags.length > 0 && (
          <span
            aria-hidden
            className="bg-base-content/15 mx-1 h-4 w-px shrink-0"
          />
        )}
        {tags.map((tag) => {
          const value = `tag:${tag}` as ShelfFilter;
          return (
            <Chip
              key={value}
              active={filter === value}
              onClick={() => onFilter(filter === value ? "all" : value)}
            >
              <Tag className="h-3 w-3 opacity-70" aria-hidden />
              {tag}
            </Chip>
          );
        })}
      </div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={`inline-flex h-7 shrink-0 items-center gap-1 rounded-full border px-3 text-xs whitespace-nowrap transition-colors ${
        active
          ? "bg-primary text-primary-content border-primary"
          : "border-base-content/12 hover:border-base-content/30 hover:bg-base-200/70 opacity-80 hover:opacity-100"
      }`}
    >
      {children}
    </button>
  );
}
