"use client";

import { AnimatePresence, motion, useDragControls } from "motion/react";
import { Fragment, useEffect, useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import type { BookWithCount } from "@/app/types";
import { Book } from "./Book";

// ── Look & feel ──────────────────────────────────────────

// Smooth, no-bounce easing used for every motion on the shelf
const EASE = [0.4, 0, 0.2, 1] as const;
const LAYOUT_TRANSITION = { layout: { duration: 0.4, ease: EASE } };

// Shelf geometry (px)
const ROW_HEIGHT = 236; // space above each ledge (tallest book + room to lift)
const SHELF_PADDING_X = 16;
const BOOK_GAP = 2;

// Real book colors (not theme colors) so the shelf looks like furniture in both themes
const SPINES = [
  { bg: "#7f1d1d", fg: "#fbe8cc", accent: "#d4a24c" }, // oxblood
  { bg: "#1e3a5f", fg: "#e8eef6", accent: "#c9a14a" }, // navy
  { bg: "#2f4f3a", fg: "#efe6cf", accent: "#c9a14a" }, // forest
  { bg: "#b7832b", fg: "#2b1d0e", accent: "#5a3b12" }, // mustard
  { bg: "#e9dfc9", fg: "#3b2a1a", accent: "#8a5a2b" }, // cream
  { bg: "#5b3a29", fg: "#f3e3c3", accent: "#d8b26a" }, // leather
  { bg: "#3f3f46", fg: "#f4f4f5", accent: "#a1a1aa" }, // charcoal
];

// Same book → same look every render (derived from its id, not random)
function spineLook(id: number) {
  return {
    ...SPINES[id % SPINES.length],
    width: 38 + ((id * 13) % 24), // 38–61px
    height: 156 + ((id * 37) % 54), // 156–209px
    variant: id % 3 === 0 ? "label" : "bands", // two decoration styles for variety
  } as const;
}

const WOOD = {
  frame: "linear-gradient(180deg, #7a5233, #5e3d24)",
  back: "linear-gradient(180deg, #2a1c12, #3a2819)",
  ledgeTop: "linear-gradient(180deg, #a27650, #8a6040)",
  ledgeFront: "linear-gradient(180deg, #6e4a2d, #573821)",
};

// Spine shading: dark edges + a highlight so it looks rounded, not flat
const SPINE_SHADE =
  "linear-gradient(to right, rgb(0 0 0 / .35), rgb(255 255 255 / .12) 25%, transparent 55%, rgb(0 0 0 / .28))";

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
const BOOKEND_WIDTH = 8;

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
      className="shrink-0 rounded-t-[2px]"
      style={{
        width: BOOKEND_WIDTH,
        height: 72,
        background:
          "linear-gradient(90deg, #3d3d3d, #9a9a9a 40%, #555 70%, #2e2e2e)",
        boxShadow: "2px 2px 4px rgb(0 0 0 / .5)",
      }}
    />
  );
}

// Brass label plate, like the holders on library shelves
const BRASS = "linear-gradient(180deg, #ecd28c, #c9a24c 55%, #a8832f)";

// ── Components ───────────────────────────────────────────

type BookShelfProps = {
  books: BookWithCount[];
  onAddBook?: () => void; // the "Create recipe" button above the bookcase
};

export function BookShelf({ books, onAddBook }: BookShelfProps) {
  // Which book is open. null = shelf only.
  const [openId, setOpenId] = useState<number | null>(null);
  const open = books.find((b) => b.id === openId);
  const close = () => setOpenId(null);
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
  const [shelfRef, shelfWidth] = useWidth<HTMLDivElement>();

  // Sections flow along the shelves like real books: a small section shares a shelf
  // with the next one (a bookend between them); a big one continues onto the next shelf.
  const shelves =
    shelfWidth > 0
      ? packShelves(
          groupBooks(books, groupBy),
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
              : `${books.length} ${books.length === 1 ? "book" : "books"}`}
          </p>
        </div>
        <div
          className={`flex items-center gap-2 ${books.length === 0 ? "invisible" : ""}`}
        >
          <span className="text-xs opacity-60">Sort shelves by</span>
          <div role="tablist" className="tabs tabs-box tabs-sm">
            {GROUP_OPTIONS.map((option) => (
              <button
                key={option.value}
                role="tab"
                aria-selected={groupBy === option.value}
                className={`tab ${groupBy === option.value ? "tab-active" : ""}`}
                onClick={() => setGroupBy(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

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
                // Start in the spine's pulled-out tilt and straighten WHILE growing,
                // instead of snapping straight on the first frame
                initial={
                  openTilted
                    ? { rotate: PULLED_OUT.rotate, y: PULLED_OUT.y }
                    : false
                }
                animate={{ rotate: 0, y: 0 }}
                transition={{ duration: 0.4, ease: EASE, ...LAYOUT_TRANSITION }}
                className="bg-base-100 pointer-events-auto relative aspect-[2/3] w-[min(92vw,calc(85vh*2/3))] overflow-hidden rounded-l-sm rounded-r-xl shadow-2xl"
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

      {/* TODO(you, stretch): close the book when Escape is pressed.
          Hint: useEffect that adds a "keydown" listener on window while `open` is set,
          and removes it in the cleanup function. */}
    </>
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
            <div className="bg-base-100 text-base-content w-max max-w-72 rounded-lg px-3 py-2 shadow-xl ring-1 ring-black/10">
              <p className="font-serif text-sm leading-snug font-semibold">
                {book.label}
              </p>
              <p className="mt-0.5 text-xs whitespace-nowrap opacity-60">
                {[book.source, logs].filter(Boolean).join(" · ")}
              </p>
            </div>
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
        className="relative block overflow-hidden rounded-[3px] outline-offset-2 focus-visible:outline-2 focus-visible:outline-white"
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
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: SPINE_SHADE }}
        />

        {look.variant === "bands" && (
          <>
            <Band top={10} color={look.accent} />
            <Band top={16} color={look.accent} thin />
            <Band bottom={26} color={look.accent} thin />
            <Band bottom={32} color={look.accent} />
          </>
        )}

        {/* Title runs down the spine; the ellipsis kicks in when it's too long */}
        <span className="absolute inset-x-0 top-7 bottom-11 flex justify-center">
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
                : { maxHeight: "100%" }
            }
          >
            {book.label}
          </span>
        </span>

        {count > 0 && (
          <span
            className="absolute inset-x-0 bottom-2 text-center text-[10px] font-bold"
            style={{ color: look.accent }}
          >
            {count}
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
