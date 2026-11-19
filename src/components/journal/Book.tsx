"use client";

import type { RecipeEntry } from "@prisma/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import { AnimatePresence, motion, type Variants } from "motion/react";
import { useEffect, useState } from "react";
import type { BookWithCount, BookWithEntries } from "@/app/types";
import axios from "axios";
import { EntryForm } from "./EntryForm";
import { CoverPage } from "./CoverPage";
import { RecipePage } from "./RecipePage";

// A page is either the cover or one journal entry.
// `kind` is the tag that tells TypeScript which one you have.
type Page =
  | { kind: "cover" }
  | { kind: "recipe" }
  | { kind: "entry"; entry: RecipeEntry };

// Page change: the old page slides out and fades, then the new page slides in from
// the side you're heading toward. `d` is the direction: 1 = ▶, -1 = ◀.
const SLIDE = 40; // px: small, so it reads as a gentle nudge, not a big swipe
// mode="wait": the old page leaves, then the new one arrives (no overlapping text)
const PAGE_TRANSITION = { duration: 0.18, ease: [0.4, 0, 0.2, 1] as const }; // smooth, no bounce

const pageSlide: Variants = {
  enter: (d: number) => ({ x: d * SLIDE, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: -d * SLIDE, opacity: 0 }),
};

// The main action's wording, in one place so it's easy to change
const LOG_LABEL = "Add a page";

type BookProps = {
  book: BookWithCount;
  onClose: () => void;
};

export function Book({ book, onClose }: BookProps) {
  const { data: entries = [], isLoading } = useQuery<RecipeEntry[]>({
    queryKey: ["entries", book.id],
    queryFn: async () => {
      const response = await axios.get<BookWithEntries>(
        `/api/library/${book.id}`,
      );
      return response.data.entries;
    },
  });

  // Cover first, then one page per entry.
  const pages: Page[] = [
    { kind: "cover" },
    { kind: "recipe" }, // always page 2
    ...entries.map((entry) => ({ kind: "entry" as const, entry })),
  ];

  // index + direction live in ONE state so they always change together.
  const [[index, dir], setPage] = useState<[number, number]>([0, 0]);

  // Clamp: if entries shrink (e.g. after a delete), don't point past the end.
  const current = Math.min(index, pages.length - 1);
  const page = pages[current];

  // ── Writing a new entry ──
  const queryClient = useQueryClient();
  const [writing, setWriting] = useState(false);
  const [jumpTo, setJumpTo] = useState<number | null>(null); // id of the entry just saved

  async function handleSaved(entry: RecipeEntry) {
    // Refetch this book's entries AND the shelf (so "Cooked N times" updates).
    // Awaiting means the new entry is in `entries` before we leave the form.
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["entries", book.id] }),
      queryClient.invalidateQueries({ queryKey: ["recipes"] }),
    ]);
    setWriting(false);
    setJumpTo(entry.id);
  }

  // After saving, flip to the new entry's page (wherever its date puts it).
  useEffect(() => {
    if (jumpTo === null) return;
    const i = entries.findIndex((e) => e.id === jumpTo);
    if (i >= 0) {
      setPage([i + 2, 1]); // +2: cover and recipe pages come first
      setJumpTo(null);
    }
  }, [jumpTo, entries]);

  function go(step: 1 | -1) {
    const next = current + step;
    if (next < 0 || next >= pages.length) return;
    setPage([next, step]);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between p-2">
        {/* Actions bar: the book's one primary action (left) and close (right) */}
        {writing ? (
          <span className="pl-4 text-xs tracking-wide opacity-60">
            New entry
          </span>
        ) : (
          <button
            className="btn btn-sm gap-1.5 font-serif text-sm font-normal hover:opacity-100"
            onClick={() => setWriting(true)}
          >
            <Plus className="h-4 w-4" /> {LOG_LABEL}
          </button>
        )}
        <button
          className="btn btn-circle btn-ghost btn-sm"
          onClick={onClose}
          aria-label="Close book"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {writing ? (
        <div className="min-h-0 flex-1">
          <EntryForm
            recipeId={book.id}
            onCancel={() => setWriting(false)}
            onSaved={handleSaved}
          />
        </div>
      ) : (
        <>
          {/* overflow-hidden clips the sliding pages to this area, so nothing
              passes over the header or the page controls */}
          <div className="relative flex-1 overflow-hidden">
            <AnimatePresence mode="wait" custom={dir} initial={false}>
              <motion.div
                key={current} // new key = new page → old page exits, new page enters
                custom={dir}
                variants={pageSlide}
                initial="enter"
                animate="center"
                exit="exit"
                transition={PAGE_TRANSITION}
                className="absolute inset-0 overflow-y-auto px-6 pb-4"
              >
                {page.kind === "cover" && (
                  <CoverPage
                    book={book}
                    entries={entries}
                    isLoading={isLoading}
                  />
                )}
                {page.kind === "recipe" && <RecipePage book={book} />}
                {page.kind === "entry" && <EntryPage entry={page.entry} />}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="border-base-300 flex items-center justify-between border-t p-3">
            <button
              className="btn btn-circle"
              onClick={() => go(-1)}
              disabled={current === 0}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            {/* Navigation bar: arrows + where you are */}
            <span className="text-sm tabular-nums opacity-70">
              {isLoading ? "Loading…" : `${current + 1} / ${pages.length}`}
            </span>
            <button
              className="btn btn-circle"
              onClick={() => go(1)}
              disabled={current === pages.length - 1}
              aria-label="Next page"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function EntryPage({ entry }: { entry: RecipeEntry }) {
  // After axios, cookedOn is a string even though the type says Date; new Date() handles both.
  // timeZone "UTC" because @db.Date is stored as midnight UTC (otherwise it shows a day early).
  const date = new Date(entry.cookedOn).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

  return (
    <div className="flex flex-col gap-4 pt-2">
      <p className="text-xs font-semibold tracking-widest uppercase opacity-60">
        {date}
      </p>
      <div className="divider my-0" />

      {entry.photoUrl && (
        <img
          src={entry.photoUrl}
          alt=""
          className="aspect-[4/3] w-full rounded-lg object-cover"
        />
      )}

      {entry.notes ? (
        <p className="font-serif text-lg leading-relaxed whitespace-pre-line">
          {entry.notes}
        </p>
      ) : (
        <p className="italic opacity-40">No notes</p>
      )}
    </div>
  );
}
