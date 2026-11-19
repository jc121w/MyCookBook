"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
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

// Fill each shelf left to right; start a new shelf when the next book won't fit.
//   widths [50, 40, 60], space 100 → [[50, 40], [60]]
function packRows<T>(
  items: T[],
  widthOf: (item: T) => number,
  space: number,
): T[][] {
  const rows: T[][] = [];
  let row: T[] = [];
  let used = 0;
  for (const item of items) {
    const w = widthOf(item);
    const next = row.length === 0 ? w : used + BOOK_GAP + w;
    if (row.length > 0 && next > space) {
      rows.push(row);
      row = [item];
      used = w;
    } else {
      row.push(item);
      used = next;
    }
  }
  if (row.length > 0) rows.push(row);
  return rows;
}

// ── Components ───────────────────────────────────────────

type BookShelfProps = {
  books: BookWithCount[];
};

export function BookShelf({ books }: BookShelfProps) {
  // Which book is open. null = shelf only.
  const [openId, setOpenId] = useState<number | null>(null);
  const open = books.find((b) => b.id === openId);
  const close = () => setOpenId(null);
  // Was the book pulled out (tilted) when clicked? Then the open book starts tilted too.
  const [openTilted, setOpenTilted] = useState(false);

  const [shelfRef, shelfWidth] = useWidth<HTMLDivElement>();
  const rows =
    shelfWidth > 0
      ? packRows(
          books,
          (b) => spineLook(b.id).width,
          shelfWidth - SHELF_PADDING_X * 2,
        )
      : [];
  // Always show at least two shelves so a small library still looks like a bookcase
  while (shelfWidth > 0 && rows.length < 2) rows.push([]);

  if (books.length === 0) {
    return (
      <p className="w-full py-16 text-center italic opacity-60">
        Your shelf is empty. Save a recipe to start a book.
      </p>
    );
  }

  return (
    <>
      {/* Bookcase frame */}
      <div
        className="w-full rounded-md p-3 shadow-xl"
        style={{ background: WOOD.frame }}
      >
        {/* Back wall. Measured, so we know how many books fit on each shelf. */}
        <div
          ref={shelfRef}
          className="min-h-[200px] overflow-hidden rounded-sm"
          style={{
            background: WOOD.back,
            boxShadow: "inset 0 8px 16px rgb(0 0 0 / .6)",
          }}
        >
          {rows.map((row, i) => (
            <div key={i}>
              {/* Books stand at the bottom of the row */}
              <div
                className="flex items-end"
                style={{
                  height: ROW_HEIGHT,
                  gap: BOOK_GAP,
                  paddingInline: SHELF_PADDING_X,
                }}
              >
                {row.map((book) => (
                  <Spine
                    key={book.id}
                    book={book}
                    onOpen={(fromPulledOut) => {
                      setOpenTilted(fromPulledOut);
                      setOpenId(book.id);
                    }}
                  />
                ))}
              </div>

              {/* Ledge: a lighter top surface, then the darker front edge */}
              <div className="relative z-[1]">
                <div style={{ height: 7, background: WOOD.ledgeTop }} />
                <div
                  style={{
                    height: 14,
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

      {/* TODO(you, stretch): close the book when Escape is pressed.
          Hint: useEffect that adds a "keydown" listener on window while `open` is set,
          and removes it in the cleanup function. */}
    </>
  );
}

// The hover pose. The open book starts from the same tilt, so there's no snap.
const PULLED_OUT = { y: -18, rotate: -4, scale: 1.04 };

function Spine({
  book,
  onOpen,
}: {
  book: BookWithCount;
  onOpen: (fromPulledOut: boolean) => void;
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

  return (
    <motion.button
      layoutId={`book-${book.id}`} // same id as the open book → it grows from here
      onClick={() => onOpen(hovered)}
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
      className="relative shrink-0 overflow-hidden rounded-[3px] outline-offset-2 hover:z-10 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-white"
      style={{
        width: look.width,
        height: look.height,
        background: look.bg,
        color: look.fg,
        transformOrigin: "bottom left",
        boxShadow: "2px 3px 5px rgb(0 0 0 / .45)",
      }}
      title={`${book.label} · ${logs}`}
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
