"use client";

import { AnimatePresence, motion, useDragControls } from "motion/react";
import { Fragment, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  CakeSlice,
  ChefHat,
  Croissant,
  CupSoda,
  Egg,
  Fish,
  Pizza,
  Plus,
  Salad,
  Sandwich,
  Soup,
  Sprout,
  Trash2,
  UtensilsCrossed,
  Wine,
  type LucideIcon,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import type { BookWithCount } from "@/app/types";
import {
  allTags,
  matchesFilter,
  matchesSearch,
  type ShelfFilter,
} from "@/lib/shelf";
import { SlidingTabs } from "@/components/SlidingTabs";
import { Book } from "./Book";
import { ShelfControls } from "./ShelfControls";

// ── Look & feel ──────────────────────────────────────────

// Smooth, no-bounce easing used for every motion on the shelf
const EASE = [0.4, 0, 0.2, 1] as const;
const LAYOUT_TRANSITION = { layout: { duration: 0.4, ease: EASE } };

// Shelf geometry (px)
const ROW_HEIGHT = 236; // space above each ledge (tallest book + room to lift)
const SHELF_PADDING_X = 16;
const BOOK_GAP = 2;

// Kitchen colors, from the same warm family as the app's cream/brown theme.
// fg = title color, accent = bands, dots and the ribbon.
const SPINES = [
  { bg: "#b5562f", fg: "#fbefe0", accent: "#f0c987" }, // terracotta
  { bg: "#7d8b6a", fg: "#f6f1e4", accent: "#e8d9a8" }, // sage
  { bg: "#c99a3c", fg: "#3b2a14", accent: "#7a4f1a" }, // mustard
  { bg: "#efe4cf", fg: "#4a3423", accent: "#b5562f" }, // cream
  { bg: "#6b4a3a", fg: "#f5e6cf", accent: "#e2b878" }, // cocoa
  { bg: "#c08a7d", fg: "#fff4ec", accent: "#7a3f33" }, // dusty rose
  { bg: "#5f6b3c", fg: "#f3ecd6", accent: "#d9c48a" }, // olive
  { bg: "#8f3f2b", fg: "#fbe8d4", accent: "#e6b96d" }, // paprika
];

// Same book → same look every render (derived from its id, not random)
function spineLook(id: number) {
  return {
    ...SPINES[id % SPINES.length],
    width: 40 + ((id * 13) % 22), // 40–61px
    height: 160 + ((id * 37) % 50), // 160–209px
    variant: id % 3 === 0 ? "label" : "bands", // two decoration styles for variety
  } as const;
}

// Honey oak shelves on a warm walnut back wall
const WOOD = {
  frame: "linear-gradient(180deg, #b07c4f, #94643d)",
  back: "linear-gradient(180deg, #5a3f2c, #6e4f37)",
  ledgeTop: "linear-gradient(180deg, #d9a877, #c08d5d)",
  ledgeFront: "linear-gradient(180deg, #a8754a, #8c5e38)",
};

// Spine shading: soft edges + a highlight so it looks rounded, not flat
const SPINE_SHADE =
  "linear-gradient(to right, rgb(0 0 0 / .28), rgb(255 255 255 / .14) 25%, transparent 55%, rgb(0 0 0 / .22))";

// A faint woven texture, like a cloth-bound cookbook
const CLOTH =
  "repeating-linear-gradient(45deg, rgb(255 255 255 / .05) 0 2px, transparent 2px 4px), repeating-linear-gradient(-45deg, rgb(0 0 0 / .05) 0 2px, transparent 2px 4px)";

// A small icon at the top of each spine for what kind of dish it is
const DISH_ICONS: [RegExp, LucideIcon][] = [
  [/soup/, Soup],
  [/salad/, Salad],
  [/dessert|sweet|cake|ice cream|biscuit|cookie|pie|tart/, CakeSlice],
  [/bread|pancake|pastr/, Croissant],
  [/cocktail|alcohol/, Wine],
  [/drink/, CupSoda],
  [/pizza/, Pizza],
  [/sandwich/, Sandwich],
  [/seafood|fish/, Fish],
  [/egg/, Egg],
  [/main|pasta|side|starter/, UtensilsCrossed],
];
const dishIcon = (dishType?: string): LucideIcon =>
  DISH_ICONS.find(([re]) => dishType && re.test(dishType))?.[1] ?? ChefHat;

// ── Helpers ──────────────────────────────────────────────

// Tracks an element's width as the window resizes
function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(entry.contentRect.width),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

// ── Grouping ─────────────────────────────────────────────

// Which recipe field sorts books onto shelves. Edamam fills all three (custom recipes may not).
type GroupBy = "dishType" | "cuisineType" | "mealType";
const GROUP_OPTIONS: { value: GroupBy; label: string }[] = [
  { value: "dishType", label: "Dish" },
  { value: "cuisineType", label: "Cuisine" },
  { value: "mealType", label: "Meal" },
];
const UNSORTED = "Uncategorized";

// "main course" → "Main Course", "lunch/dinner" → "Lunch/Dinner"
const titleCase = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());

// Books → [{ name: "Main Course", books: [...] }, ...], biggest section first,
// Uncategorized last. A recipe with several types goes under its first one.
function groupBooks(books: BookWithCount[], by: GroupBy) {
  const groups = new Map<string, BookWithCount[]>();
  for (const book of books) {
    const first = book[by]?.[0];
    const name = first ? titleCase(first) : UNSORTED;
    groups.set(name, [...(groups.get(name) ?? []), book]);
  }
  return [...groups]
    .map(([name, books]) => ({ name, books }))
    .sort(
      (a, b) =>
        Number(a.name === UNSORTED) - Number(b.name === UNSORTED) ||
        b.books.length - a.books.length ||
        a.name.localeCompare(b.name),
    );
}

// One run of same-category books on a shelf. A section that spills onto the next
// shelf continues there without repeating its label.
type Section = {
  name: string;
  count: number;
  showLabel: boolean;
  books: BookWithCount[];
};

const SECTION_SPACE = 10; // px on each side of a bookend
const BOOKEND_WIDTH = 30; // the little potted herb between sections

// Rough width of a label plate (10px uppercase, wide tracking ≈ 8.5px per character)
function plateWidth(section: { name: string; count: number }) {
  return (section.name.length + String(section.count).length + 3) * 8.5 + 22;
}

// Width of a section on the shelf: its books, or its label plate if that's wider
function sectionWidth(section: Section) {
  const books = section.books.reduce(
    (sum, b, i) => sum + spineLook(b.id).width + (i > 0 ? BOOK_GAP : 0),
    0,
  );
  return section.showLabel ? Math.max(books, plateWidth(section)) : books;
}

// Lay sections onto shelves left to right, wrapping like text:
//   [Main Course ×5 | Soup ×3]  [Desserts ×2 | Bread ×1]  ...
function packShelves(
  groups: { name: string; books: BookWithCount[] }[],
  space: number,
) {
  const shelves: Section[][] = [];
  let shelf: Section[] = [];
  let used = 0; // width of finished sections + bookends on the current shelf

  for (const group of groups) {
    let current = null as Section | null; // (cast: keeps TS from narrowing it to null inside the loop)

    for (const book of group.books) {
      if (current) {
        // Add to the open section if it still fits...
        const grown = { ...current, books: [...current.books, book] };
        if (used + sectionWidth(grown) <= space) {
          current.books.push(book);
          continue;
        }
        // ...otherwise continue the section on a new shelf, without repeating its label
        shelves.push(shelf);
        current = { ...current, showLabel: false, books: [book] };
        shelf = [current];
        used = 0;
        continue;
      }

      // First book of a section: needs a bookend if the shelf already has books
      current = {
        name: group.name,
        count: group.books.length,
        showLabel: true,
        books: [book],
      };
      const bookend = shelf.length > 0 ? SECTION_SPACE * 2 + BOOKEND_WIDTH : 0;
      if (shelf.length > 0 && used + bookend + sectionWidth(current) > space) {
        shelves.push(shelf);
        shelf = [];
        used = 0;
      } else {
        used += bookend;
      }
      shelf.push(current);
    }

    if (current) used += sectionWidth(current);
  }

  if (shelf.length > 0) shelves.push(shelf);
  return shelves;
}

// Bookends and label plates glide to their new spots when you regroup, with the
// same timing as the books (shared layoutId per section). Ones that don't exist in
// the new grouping fade in, so nothing pops or jumps.
const SLIDE_IN = { opacity: 0 };
const SETTLED = { opacity: 1 };

function Bookend({ id }: { id: string }) {
  return (
    <motion.div
      layoutId={`bookend-${id}`}
      layout="position" // move only; never stretch
      initial={SLIDE_IN}
      animate={SETTLED}
      transition={{ duration: 0.25, ...LAYOUT_TRANSITION }}
      aria-hidden
      className="flex shrink-0 flex-col items-center"
      style={{ width: BOOKEND_WIDTH }}
    >
      {/* A potted herb: leaves, then a terracotta pot with a rim */}
      <Sprout
        className="-mb-1 h-8 w-8 text-[#8fae6b] drop-shadow"
        strokeWidth={2}
      />
      <span className="block h-1.5 w-[30px] rounded-sm bg-[#c26a43] shadow-sm" />
      <span
        className="block h-6 w-6 bg-[#b05a36] shadow-md"
        style={{ clipPath: "polygon(0 0, 100% 0, 85% 100%, 15% 100%)" }}
      />
    </motion.div>
  );
}

// Brass label plate, like the holders on library shelves
const BRASS = "linear-gradient(180deg, #ecd28c, #c9a24c 55%, #a8832f)";

// ── Components ───────────────────────────────────────────

type BookShelfProps = {
  books: BookWithCount[];
  onAddBook?: () => void; // the "Create recipe" button above the bookcase
  openBookId?: number | null; // open this book once the shelf is drawn (e.g. /library?book=12)
  onBookClosed?: () => void; // a book was closed (the page uses it to tidy the URL)
};

export function BookShelf({
  books,
  onAddBook,
  openBookId,
  onBookClosed,
}: BookShelfProps) {
  // Which book is open. null = shelf only.
  const [openId, setOpenId] = useState<number | null>(null);
  const open = books.find((b) => b.id === openId);
  const close = () => {
    setOpenId(null);
    onBookClosed?.();
  };
  // Was the book pulled out (tilted) when clicked? Then the open book starts tilted too.
  const [openTilted, setOpenTilted] = useState(false);

  // ── Drag a book to the trash to remove it ──
  const trashRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false); // shows the trash can
  const [overTrash, setOverTrash] = useState(false); // highlights it
  const [toRemove, setToRemove] = useState<BookWithCount | null>(null); // asks to confirm

  // Is the pointer over the trash can? info.point is page coordinates, rects are viewport.
  function isOverTrash(point: { x: number; y: number }) {
    const rect = trashRef.current?.getBoundingClientRect();
    if (!rect) return false;
    const x = point.x - window.scrollX;
    const y = point.y - window.scrollY;
    const slop = 16; // a little forgiveness around the edge
    return (
      x >= rect.left - slop &&
      x <= rect.right + slop &&
      y >= rect.top - slop &&
      y <= rect.bottom + slop
    );
  }

  const queryClient = useQueryClient();
  const removeBook = useMutation({
    mutationFn: (bookId: number) => axios.delete(`/api/library/${bookId}`),
    onSuccess: async (_res, bookId) => {
      setToRemove(null);
      queryClient.removeQueries({ queryKey: ["entries", bookId] });
      await queryClient.invalidateQueries({ queryKey: ["recipes"] });
    },
  });

  const [groupBy, setGroupBy] = useState<GroupBy>("dishType");

  // ── Search, filters and "What should I cook?" (logic in src/lib/shelf.ts) ──
  const [query, setQuery] = useState("");
  const [chosenFilter, setFilter] = useState<ShelfFilter>("all");
  const tags = allTags(books);
  // A tag filter whose tag no longer exists (you removed it) falls back to All
  const filter =
    chosenFilter.startsWith("tag:") &&
    !tags.some((t) => `tag:${t}`.toLowerCase() === chosenFilter.toLowerCase())
      ? "all"
      : chosenFilter;
  const visibleBooks = books.filter(
    (b) => matchesSearch(b, query) && matchesFilter(b, filter),
  );
  const filtering = query.trim() !== "" || filter !== "all";

  // Keyboard: Escape cancels the remove dialog, or else closes the open book
  useEffect(() => {
    if (openId == null && toRemove == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (toRemove) {
        if (!removeBook.isPending) setToRemove(null);
      } else close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
  const [shelfRef, shelfWidth] = useWidth<HTMLDivElement>();

  // While a book is open it's a modal: lock the page behind it so it can't scroll.
  // (Scrolling INSIDE the book still works.) The scrollbar's width is added as padding
  // so the page doesn't jump sideways when the scrollbar disappears.
  const isOpen = open != null;

  // When a book opens, move keyboard focus into it (once per book)
  const bookRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (openId != null) bookRef.current?.focus({ preventScroll: true });
  }, [openId]);
  useEffect(() => {
    if (!isOpen) return;
    const { overflow, paddingRight } = document.body.style;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;
    return () => {
      document.body.style.overflow = overflow; // put back whatever was there
      document.body.style.paddingRight = paddingRight;
    };
  }, [isOpen]);

  // Arriving with a book to open (from search's "On your shelf", or the profile):
  // wait until the shelf is drawn, then open it, so it grows out of its own spine
  // and you see where it lives. Once per book id.
  const openedFromOutside = useRef<number | null>(null);
  useEffect(() => {
    if (openBookId == null || openedFromOutside.current === openBookId) return;
    if (shelfWidth === 0 || !books.some((b) => b.id === openBookId)) return;
    openedFromOutside.current = openBookId;
    const timer = setTimeout(() => {
      setOpenTilted(false);
      setOpenId(openBookId);
    }, 350); // a beat to see the shelf first
    return () => clearTimeout(timer);
  }, [openBookId, shelfWidth, books]);

  // Sections flow along the shelves like real books: a small section shares a shelf
  // with the next one (a bookend between them); a big one continues onto the next shelf.
  const shelves =
    shelfWidth > 0
      ? packShelves(
          groupBooks(visibleBooks, groupBy),
          shelfWidth - SHELF_PADDING_X * 2,
        )
      : [];

  // Always show at least two shelves so a small library still looks like a bookcase
  while (shelfWidth > 0 && shelves.length < 2) shelves.push([]);

  return (
    <>
      {/* Shelf controls: create (always here, never moves) on the left, sorting on the right */}
      <div className="mb-3 flex w-full flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {onAddBook && (
            <button
              type="button"
              onClick={onAddBook}
              className="btn btn-sm gap-1.5 border-0 font-serif text-[#3b2a14] hover:brightness-105"
              style={{
                background: BRASS,
                boxShadow:
                  "inset 0 1px 0 rgb(255 255 255 / .5), 0 1px 3px rgb(0 0 0 / .35)",
              }}
            >
              <Plus className="h-4 w-4" strokeWidth={2.25} /> Create recipe
            </button>
          )}
          <p className="text-sm opacity-60">
            {books.length === 0
              ? "Your shelf is empty. Create your first recipe."
              : filtering
                ? `${visibleBooks.length} of ${books.length} books`
                : `${books.length} ${books.length === 1 ? "book" : "books"}`}
          </p>
        </div>
        <div
          className={`flex items-center gap-2 ${books.length === 0 ? "invisible" : ""}`}
        >
          {/* Hidden on small phones, where it wraps; the tabs still say it to screen readers */}
          <span className="hidden text-xs opacity-60 sm:inline">
            Sort shelves by
          </span>
          <SlidingTabs
            label="Sort shelves by"
            variant="soft"
            options={GROUP_OPTIONS}
            value={groupBy}
            onChange={setGroupBy}
          />
        </div>
      </div>

      {books.length > 0 && (
        <ShelfControls
          query={query}
          onQuery={setQuery}
          filter={filter}
          onFilter={setFilter}
          tags={tags}
        />
      )}
      {filtering && visibleBooks.length === 0 && (
        <div className="border-base-content/20 mb-3 flex flex-wrap items-center justify-center gap-2 rounded-xl border border-dashed p-4 text-center">
          <p className="font-serif text-sm italic opacity-70">
            No books match
            {query.trim() ? <> &ldquo;{query.trim()}&rdquo;</> : " this filter"}
            .
          </p>
          <button
            type="button"
            className="btn btn-ghost btn-xs"
            onClick={() => {
              setQuery("");
              setFilter("all");
            }}
          >
            Clear
          </button>
        </div>
      )}

      {/* Bookcase frame */}
      <div
        className="w-full rounded-md p-3 shadow-xl"
        style={{ background: WOOD.frame }}
      >
        {/* Back wall. Measured, so we know how many books fit on each shelf. */}
        <div
          ref={shelfRef}
          // No overflow-hidden: the hover tag above a book may poke past the top shelf
          className="min-h-[200px] rounded-sm"
          style={{
            background: WOOD.back,
            boxShadow: "inset 0 8px 16px rgb(0 0 0 / .6)",
          }}
        >
          {shelves.map((sections, i) => (
            <div key={i}>
              {/* Books stand at the bottom of the row */}
              <div
                className="flex items-end"
                style={{
                  height: ROW_HEIGHT,
                  gap: SECTION_SPACE,
                  paddingInline: SHELF_PADDING_X,
                }}
              >
                {sections.map((section, j) => (
                  <Fragment key={`${section.name}-${j}`}>
                    {j > 0 && <Bookend id={`${groupBy}-${section.name}`} />}
                    <div
                      className="relative flex items-end"
                      style={{
                        gap: BOOK_GAP,
                        // a labeled section is at least as wide as its plate
                        minWidth: section.showLabel
                          ? plateWidth(section)
                          : undefined,
                      }}
                    >
                      {section.books.map((book) => (
                        <Spine
                          key={book.id}
                          book={book}
                          onOpen={(fromPulledOut) => {
                            setOpenTilted(fromPulledOut);
                            setOpenId(book.id);
                          }}
                          onDragStart={() => setDragging(true)}
                          onDragMove={(point) =>
                            setOverTrash(isOverTrash(point))
                          }
                          onDragEnd={(point) => {
                            if (isOverTrash(point)) setToRemove(book);
                            setDragging(false);
                            setOverTrash(false);
                          }}
                        />
                      ))}

                      {/* Brass plate on the ledge, under the section's first book */}
                      {section.showLabel && (
                        <motion.span
                          layoutId={`plate-${groupBy}-${section.name}`}
                          layout="position"
                          initial={SLIDE_IN}
                          animate={SETTLED}
                          transition={{ duration: 0.25, ...LAYOUT_TRANSITION }}
                          className="absolute left-0 z-[2] flex h-5 items-center gap-1.5 rounded-sm px-2.5 text-[10px] font-semibold tracking-[0.18em] whitespace-nowrap uppercase"
                          style={{
                            top: "calc(100% + 5px)", // centered on the ledge's front edge
                            background: BRASS,
                            color: "#3b2a14",
                            boxShadow:
                              "inset 0 1px 0 rgb(255 255 255 / .5), 0 1px 2px rgb(0 0 0 / .5)",
                          }}
                        >
                          {section.name}
                          <span className="opacity-60">· {section.count}</span>
                        </motion.span>
                      )}
                    </div>
                  </Fragment>
                ))}
              </div>

              {/* Ledge: a lighter top surface, then the darker front edge */}
              <div className="relative z-[1]">
                <div style={{ height: 7, background: WOOD.ledgeTop }} />
                <div
                  style={{
                    height: 16,
                    background: WOOD.ledgeFront,
                    boxShadow: "0 8px 12px rgb(0 0 0 / .45)", // shadow onto the wall below
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop is a SIBLING of the book, not its parent.
                If the book were inside it, the backdrop's fade would also fade the book. */}
            <motion.div
              key="backdrop"
              className="fixed inset-0 z-40 bg-black/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: EASE }}
              onClick={close}
            />

            {/* Centering layer. pointer-events-none lets clicks around the book
                fall through to the backdrop. */}
            <div
              key="book"
              className="pointer-events-none fixed inset-0 z-50 grid place-items-center p-4"
            >
              <motion.div
                layoutId={`book-${open.id}`}
                // A modal dialog for screen readers; focus moves into it when it opens
                role="dialog"
                aria-modal="true"
                aria-label={open.label}
                tabIndex={-1}
                ref={bookRef}
                // Start in the spine's pulled-out tilt and straighten WHILE growing,
                // instead of snapping straight on the first frame
                initial={
                  openTilted
                    ? { rotate: PULLED_OUT.rotate, y: PULLED_OUT.y }
                    : false
                }
                animate={{ rotate: 0, y: 0 }}
                transition={{ duration: 0.4, ease: EASE, ...LAYOUT_TRANSITION }}
                className="bg-base-100 pointer-events-auto relative h-[calc(min(92vw,calc(85svh*2/3))*1.5)] w-[min(92vw,calc(85svh*2/3))] overflow-hidden rounded-l-sm rounded-r-xl shadow-2xl outline-none"
              >
                <OpenSpine id={open.id} />
                {/* Pages sit to the right of the spine */}
                <div
                  className="h-full"
                  style={{ paddingLeft: OPEN_SPINE_WIDTH }}
                >
                  <Book book={open} onClose={close} />
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Hint, so people know removing exists */}
      {books.length > 0 && (
        <p className="mt-2 text-center text-xs opacity-40">
          Drag a book off the shelf to remove it.
        </p>
      )}

      {/* Trash can: only while a book is being dragged */}
      <AnimatePresence>
        {dragging && (
          <motion.div
            ref={trashRef}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0, scale: overTrash ? 1.15 : 1 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.2, ease: EASE }}
            className={`fixed bottom-8 left-1/2 z-30 flex -translate-x-1/2 flex-col items-center gap-1.5 rounded-2xl px-6 py-4 shadow-2xl transition-colors ${
              overTrash
                ? "bg-error text-error-content"
                : "bg-base-100 text-base-content"
            }`}
          >
            <Trash2 className="h-7 w-7" />
            <span className="text-xs font-medium">
              {overTrash ? "Let go to remove" : "Drag here to remove"}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm before deleting anything */}
      <AnimatePresence>
        {toRemove && (
          <motion.div
            className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !removeBook.isPending && setToRemove(null)}
          >
            <motion.div
              role="alertdialog"
              aria-labelledby="remove-title"
              initial={{ scale: 0.95, y: 8 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 8 }}
              transition={{ duration: 0.18, ease: EASE }}
              onClick={(e) => e.stopPropagation()}
              className="bg-base-100 w-full max-w-sm rounded-xl p-6 shadow-2xl"
            >
              <h2 id="remove-title" className="font-serif text-xl font-bold">
                Remove &ldquo;{toRemove.label}&rdquo;?
              </h2>
              <p className="mt-2 text-sm opacity-70">
                {toRemove._count.entries > 0
                  ? `Its ${toRemove._count.entries === 1 ? "journal entry" : `${toRemove._count.entries} journal entries`} and photos will be deleted too. `
                  : ""}
                This can&apos;t be undone.
              </p>
              {removeBook.isError && (
                <p className="text-error mt-3 text-sm">
                  Couldn&apos;t remove it. Try again.
                </p>
              )}
              <div className="mt-6 flex justify-end gap-2">
                <button
                  className="btn btn-ghost"
                  onClick={() => {
                    setToRemove(null);
                    removeBook.reset();
                  }}
                  disabled={removeBook.isPending}
                  autoFocus
                >
                  Cancel
                </button>
                <button
                  className="btn btn-error"
                  onClick={() => removeBook.mutate(toRemove.id)}
                  disabled={removeBook.isPending}
                >
                  {removeBook.isPending ? (
                    <span className="loading loading-spinner loading-sm" />
                  ) : (
                    "Remove"
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// The hover tag's box. Centered over the book, but if that would push it past the
// edge of the screen (books at either end, small phones), it slides back inside.
// The little pointer below stays centered on the book.
function TagBubble({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shift, setShift] = useState(0);

  useLayoutEffect(() => {
    const box = ref.current?.getBoundingClientRect();
    if (!box) return;
    const margin = 8;
    if (box.left < margin) setShift(margin - box.left);
    else if (box.right > window.innerWidth - margin)
      setShift(window.innerWidth - margin - box.right);
  }, []);

  return (
    <div
      ref={ref}
      className="bg-base-100 text-base-content w-max max-w-[min(18rem,calc(100vw-16px))] rounded-lg px-3 py-2 shadow-xl ring-1 ring-black/10"
      style={{ translate: `${shift}px 0` }}
    >
      {children}
    </div>
  );
}

// ── Press-and-hold helpers ──
const RESTING = {
  scale: 1,
  rotate: 0,
  boxShadow: "2px 3px 5px rgb(0 0 0 / .45)",
};
const PICKED_UP = {
  scale: 1.08,
  rotate: [0, -4, 4, -3, 2, 0], // keyframes: a short shake, like it buzzed in your hand
  boxShadow: "10px 16px 22px rgb(0 0 0 / .5)",
  transition: { duration: 0.35, ease: "easeOut" as const },
};
const LONG_PRESS_MS = 400;
const MOVE_TOLERANCE = 8; // px a finger may wobble during the hold

// While a held book is being dragged, stop the page from scrolling under the finger.
// (touchmove must be non-passive for preventDefault to work.)
const preventScroll = (e: TouchEvent) => e.preventDefault();
function blockTouchScroll() {
  document.addEventListener("touchmove", preventScroll, { passive: false });
}
function unblockTouchScroll() {
  document.removeEventListener("touchmove", preventScroll);
}

// The hover pose. The open book starts from the same tilt, so there's no snap.
const PULLED_OUT = { y: -18, rotate: -4, scale: 1.04 };

function Spine({
  book,
  onOpen,
  onDragStart,
  onDragMove,
  onDragEnd,
}: {
  book: BookWithCount;
  onOpen: (fromPulledOut: boolean) => void;
  onDragStart: () => void;
  onDragMove: (point: { x: number; y: number }) => void;
  onDragEnd: (point: { x: number; y: number }) => void;
}) {
  const look = spineLook(book.id);
  const count = book._count.entries;
  const DishIcon = dishIcon(book.dishType[0]);
  const logs =
    count === 0
      ? "No recipe logs"
      : count === 1
        ? "1 recipe log"
        : `${count} recipe logs`;

  // Is it pulled out right now? The open book starts from this pose if so.
  const [hovered, setHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  // The browser still fires a click when you let go after dragging; this ignores it
  const justDragged = useRef(false);

  // ── Press-and-hold to pick up (touch only) ──
  // On a phone, a swipe across the books should scroll the page, so a touch only
  // picks a book up after holding still for LONG_PRESS_MS. A mouse drags right away.
  const dragControls = useDragControls();
  const pressTimer = useRef<number | null>(null);
  const pressStart = useRef<{ x: number; y: number } | null>(null);
  const pickedUp = useRef(false); // a hold fired: the lift-off shouldn't count as a click
  const [held, setHeld] = useState(false); // drives the "picked up" lift + wiggle

  function cancelPress() {
    if (pressTimer.current) window.clearTimeout(pressTimer.current);
    pressTimer.current = null;
    pressStart.current = null;
  }

  function onPointerDown(e: React.PointerEvent) {
    if (e.pointerType === "mouse") {
      dragControls.start(e); // mouse: drag immediately (a plain click still opens the book)
      return;
    }
    const pointer = e.nativeEvent; // kept for when the timer fires
    pressStart.current = { x: e.clientX, y: e.clientY };
    pressTimer.current = window.setTimeout(() => {
      pressTimer.current = null;
      pickedUp.current = true;
      navigator.vibrate?.(15); // haptic buzz where supported (Android; iOS Safari has no vibration API)
      setHeld(true); // visual buzz for everyone: lift + wiggle
      blockTouchScroll(); // from here on, finger movement drags the book, not the page
      dragControls.start(pointer);
    }, LONG_PRESS_MS);
  }

  function onPointerMove(e: React.PointerEvent) {
    // Moved before the hold finished → it's a scroll/swipe, not a pick-up
    if (!pressTimer.current || !pressStart.current) return;
    const moved = Math.hypot(
      e.clientX - pressStart.current.x,
      e.clientY - pressStart.current.y,
    );
    if (moved > MOVE_TOLERANCE) cancelPress();
  }

  function onPointerEnd() {
    setHeld(false);
    cancelPress();
    unblockTouchScroll();
    setTimeout(() => (pickedUp.current = false), 0); // after the stray click
  }

  return (
    // Wrapper holds the hover tag (the button itself clips its decorations).
    // z-20 on hover lifts book + tag above neighbors and the shelves.
    // z-40 while dragging, so the book passes over the trash can, not under it.
    <div
      className="relative shrink-0 focus-within:z-20 hover:z-20"
      // inline, so it beats hover:z-20 (the pointer is always over the book while dragging)
      style={isDragging ? { zIndex: 40 } : undefined}
    >
      <AnimatePresence>
        {hovered && !isDragging && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.15, ease: EASE }}
            className="pointer-events-none absolute left-1/2 -translate-x-1/2"
            // sits just above the book's pulled-out top
            style={{ bottom: look.height - PULLED_OUT.y + 10 }}
          >
            <TagBubble>
              <p className="font-serif text-sm leading-snug font-semibold break-words">
                {book.label}
              </p>
              {/* Source and log count on their own lines, so long sources wrap instead of overflowing */}
              {book.source && (
                <p className="mt-0.5 text-xs leading-snug break-words opacity-60">
                  {book.source}
                </p>
              )}
              <p className="text-xs leading-snug opacity-60">{logs}</p>
            </TagBubble>
            {/* little pointer under the tag */}
            <div className="bg-base-100 absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        layoutId={`book-${book.id}`} // same id as the open book → it grows from here
        onClick={() => {
          if (justDragged.current || pickedUp.current) return;
          onOpen(hovered);
        }}
        // Drag to remove: the book follows the pointer, then slides back to its spot.
        // We start drags ourselves (dragListener off) to get press-and-hold on touch.
        drag
        dragListener={false}
        dragControls={dragControls}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onContextMenu={(e) => e.preventDefault()} // long-press shouldn't open a menu
        dragSnapToOrigin
        dragMomentum={false}
        // Picked up by a hold: lifts (bigger, deeper shadow) with a quick wiggle, so you
        // know it's ready to drag before you move. Resting values otherwise.
        animate={held ? PICKED_UP : RESTING}
        whileDrag={{
          scale: 1.08,
          rotate: -6,
          boxShadow: "14px 22px 30px rgb(0 0 0 / .5)",
        }}
        onDragStart={() => {
          justDragged.current = true;
          setIsDragging(true);
          onDragStart();
        }}
        onDrag={(_, info) => onDragMove(info.point)}
        onDragEnd={(_, info) => {
          setIsDragging(false);
          setHeld(false);
          onDragEnd(info.point);
          unblockTouchScroll();
          setTimeout(() => (justDragged.current = false), 0); // after the stray click
        }}
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        // Pulled out: lifts off the shelf, tips toward you, and casts a bigger shadow.
        // transformOrigin "bottom left" = it pivots on its bottom corner, like a real book.
        whileHover={{
          ...PULLED_OUT,
          boxShadow: "8px 14px 18px rgb(0 0 0 / .55)",
        }}
        transition={{ duration: 0.22, ease: EASE, ...LAYOUT_TRANSITION }}
        // Keyboard users get a focus ring instead of the tilt (a click also focuses,
        // and a tilt-on-focus would keep the book tilted after clicking)
        className="relative block rounded-[3px] outline-offset-2 focus-visible:outline-2 focus-visible:outline-white"
        style={{
          width: look.width,
          height: look.height,
          background: look.bg,
          color: look.fg,
          transformOrigin: "bottom left",
          boxShadow: "2px 3px 5px rgb(0 0 0 / .45)",
          touchAction: "pan-x pan-y", // let swipes scroll; a hold takes over (see blockTouchScroll)
          WebkitTouchCallout: "none", // no iOS long-press preview/menu
          userSelect: "none",
        }}
        aria-label={`${book.label}, ${logs}`}
      >
        {/* Cloth texture + rounded-spine shading */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[3px]"
          style={{ background: `${SPINE_SHADE}, ${CLOTH}` }}
        />

        {/* Ribbon bookmark sticking out of the top: this book has entries */}
        {count > 0 && (
          <span
            aria-hidden
            className="absolute -top-3 h-6 w-[7px] shadow-sm"
            style={{
              right: 10,
              background: look.accent,
              clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%)", // notched tail
            }}
          />
        )}

        {/* Headband and tail band, like a bound book */}
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-[5px] rounded-t-[3px] opacity-60"
          style={{ background: look.accent }}
        />
        <span
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-[5px] rounded-b-[3px] opacity-60"
          style={{ background: look.accent }}
        />

        {look.variant === "bands" && (
          <>
            <Band top={36} color={look.accent} thin />
            <Band bottom={30} color={look.accent} thin />
          </>
        )}

        {/* What kind of dish, at the top of the spine */}
        <span
          className="absolute inset-x-0 top-3 flex justify-center"
          style={{ color: look.fg }}
        >
          <DishIcon className="h-4 w-4 opacity-80" strokeWidth={1.75} />
        </span>

        {/* Title runs down the spine; the ellipsis kicks in when it's too long */}
        <span className="absolute inset-x-0 top-10 bottom-9 flex justify-center">
          <span
            className="overflow-hidden font-serif text-[13px] font-semibold tracking-wide text-ellipsis whitespace-nowrap [writing-mode:vertical-rl]"
            style={
              look.variant === "label"
                ? {
                    background: look.fg,
                    color: look.bg,
                    padding: "8px 3px",
                    borderRadius: 2,
                    maxHeight: "100%",
                  }
                : { maxHeight: "100%", color: look.fg }
            }
          >
            {book.label}
          </span>
        </span>

        {/* How many times you've cooked it: little dots, up to 5 (then "5+") */}
        {count > 0 && (
          <span
            className="absolute inset-x-0 bottom-3 flex flex-col items-center gap-[3px]"
            aria-hidden
          >
            <span className="flex gap-[3px]">
              {Array.from({ length: Math.min(count, 5) }).map((_, i) => (
                <span
                  key={i}
                  className="h-[5px] w-[5px] rounded-full"
                  style={{ background: look.accent }}
                />
              ))}
            </span>
            {count > 5 && (
              <span
                className="text-[8px] leading-none font-bold"
                style={{ color: look.accent }}
              >
                {count}
              </span>
            )}
          </span>
        )}
      </motion.button>
    </div>
  );
}

// ── The open book's spine ──
const OPEN_SPINE_WIDTH = 30;

// Raised ridges across the spine, like a leather-bound book (as % from the top)
const HUBS = [14, 32, 68, 86];

function OpenSpine({ id }: { id: number }) {
  const look = spineLook(id); // same color as the book on the shelf

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-y-0 left-0 z-10 flex"
    >
      {/* Cover leather */}
      <div
        className="relative h-full"
        style={{ width: OPEN_SPINE_WIDTH, background: look.bg }}
      >
        {/* Rounded-spine shading */}
        <div className="absolute inset-0" style={{ background: SPINE_SHADE }} />

        {/* Gold tooling: double rule near the top and bottom */}
        <div
          className="absolute inset-x-1.5 top-3 h-[2px]"
          style={{ background: look.accent }}
        />
        <div
          className="absolute inset-x-1.5 top-[17px] h-px"
          style={{ background: look.accent }}
        />
        <div
          className="absolute inset-x-1.5 bottom-[17px] h-px"
          style={{ background: look.accent }}
        />
        <div
          className="absolute inset-x-1.5 bottom-3 h-[2px]"
          style={{ background: look.accent }}
        />

        {/* Raised hubs: highlight on top, shadow underneath, gold edge */}
        {HUBS.map((top) => (
          <div
            key={top}
            className="absolute inset-x-0 h-[7px] -translate-y-1/2"
            style={{
              top: `${top}%`,
              background:
                "linear-gradient(180deg, rgb(255 255 255 / .28), rgb(255 255 255 / .05) 45%, rgb(0 0 0 / .35))",
              borderTop: `1px solid ${look.accent}`,
              borderBottom: `1px solid ${look.accent}`,
              boxShadow: "0 2px 3px rgb(0 0 0 / .35)",
            }}
          />
        ))}

        {/* Small emblem in the middle */}
        <div
          className="absolute top-1/2 left-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45"
          style={{ border: `1px solid ${look.accent}` }}
        />

        {/* Hinge: a dark groove where the cover meets the pages */}
        <div
          className="absolute inset-y-0 right-0 w-[3px]"
          style={{ background: "rgb(0 0 0 / .35)" }}
        />
      </div>

      {/* Gutter: the pages curve into the binding, so they darken near it */}
      <div
        className="h-full w-5"
        style={{
          background:
            "linear-gradient(to right, rgb(0 0 0 / .16), transparent)",
        }}
      />
    </div>
  );
}

function Band({
  top,
  bottom,
  color,
  thin = false,
}: {
  top?: number;
  bottom?: number;
  color: string;
  thin?: boolean;
}) {
  return (
    <span
      aria-hidden
      className="absolute inset-x-0"
      style={{
        top,
        bottom,
        height: thin ? 1 : 3,
        background: color,
        opacity: 0.85,
      }}
    />
  );
}
