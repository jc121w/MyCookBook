"use client";

import type { RecipeEntry } from "@prisma/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { AnimatePresence, motion, type Variants } from "motion/react";
import { useEffect, useState } from "react";
import type { BookWithCount, BookWithEntries } from "@/app/types";
import axios from "axios";
import { EntryForm } from "./EntryForm";
import { KnifeCelebration } from "./KnifeCelebration";
import { createPortal } from "react-dom";
import { CoverPage } from "./CoverPage";
import { EntryDetail, JournalList } from "./JournalPage";
import { RecipePage } from "./RecipePage";
import RecipeForm from "@/components/form/RecipeForm";

// The book has three pages: cover, the recipe, and the journal (a list of entries).
// `kind` is the tag that tells TypeScript which one you have.
type Page = { kind: "cover" } | { kind: "recipe" } | { kind: "journal" };
const PAGES: Page[] = [
  { kind: "cover" },
  { kind: "recipe" },
  { kind: "journal" },
];
const JOURNAL_PAGE = 2;
const PAGE_LABELS: Record<Page["kind"], string> = {
  cover: "Cover",
  recipe: "Recipe",
  journal: "Journal",
};

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

  const pages = PAGES;

  // index + direction live in ONE state so they always change together.
  const [[current, dir], setPage] = useState<[number, number]>([0, 0]);
  const page = pages[current];

  // Which entry is open full-size on the journal page (null = the list)
  const [openEntryId, setOpenEntryId] = useState<number | null>(null);
  const openEntry = entries.find((e) => e.id === openEntryId);

  // ── Writing a new entry ──
  const queryClient = useQueryClient();

  // ── Deleting ──
  // Both refetch the shelf too, so its counts and books stay in sync.
  async function deleteEntry(entryId: number) {
    await axios.delete(`/api/entries/${entryId}`);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["entries", book.id] }),
      queryClient.invalidateQueries({ queryKey: ["recipes"] }),
    ]);
    setOpenEntryId(null); // back to the list
  }

  const [writing, setWriting] = useState(false);
  const [celebrating, setCelebrating] = useState(false); // the knife-slice after logging a cook
  const [editing, setEditing] = useState(false); // editing the recipe itself

  async function handleSaved(entry: RecipeEntry) {
    setCelebrating(true); // start right away: the save just succeeded
    // Refetch this book's entries AND the shelf (so "Cooked N times" updates).
    // Awaiting means the new entry is in `entries` before we leave the form.
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["entries", book.id] }),
      queryClient.invalidateQueries({ queryKey: ["recipes"] }),
    ]);
    setWriting(false);
    // Behind the curtain: go to the journal page, so the reveal shows your new entry
    // in the collection. It opens once the animation finishes (see the effect below).
    setPage([JOURNAL_PAGE, 1]);
    setNewEntryId(entry.id);
  }

  // Open the new entry once BOTH are true: the celebration has finished, and the entry
  // has loaded. Either can happen first (a slow network can outlast the animation),
  // so wait for whichever is last, instead of opening on a timer.
  const [newEntryId, setNewEntryId] = useState<number | null>(null);
  useEffect(() => {
    if (celebrating || newEntryId === null) return;
    if (!entries.some((e) => e.id === newEntryId)) return;
    setOpenEntryId(newEntryId); // grows open from its card
    setNewEntryId(null);
  }, [celebrating, newEntryId, entries]);

  function go(step: 1 | -1) {
    goTo(current + step);
  }

  // Jump to any page; the slide direction follows which way you're going
  function goTo(target: number) {
    if (target < 0 || target >= pages.length || target === current) return;
    setOpenEntryId(null); // leaving the journal closes any open entry
    setPage([target, target > current ? 1 : -1]);
  }

  return (
    <div className="flex h-full flex-col">
      {/* Rendered into <body> through a portal: the open book is inside a transformed
          (animated) container, which would trap a fixed overlay inside the book */}
      {celebrating &&
        createPortal(
          <KnifeCelebration onDone={() => setCelebrating(false)} />,
          document.body,
        )}
      <div className="flex items-center justify-between p-2">
        {/* Top bar: what you're doing (left) and close (right).
            Adding a page lives on the journal page itself, as its first card. */}
        <span className="pl-4 text-xs tracking-wide opacity-60">
          {writing ? "New entry" : ""}
        </span>
        <button
          className="btn btn-circle btn-ghost btn-sm"
          onClick={onClose}
          aria-label="Close book"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {editing ? (
        // The same form as "Create recipe", filled in, inside the book
        <div className="min-h-0 flex-1">
          <RecipeForm
            recipe={book}
            variant="panel"
            onDone={() => setEditing(false)}
          />
        </div>
      ) : writing ? (
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
                layoutScroll // lets rows grow from the right spot even when the list is scrolled
                className="absolute inset-0 overflow-y-auto px-6 pb-4"
              >
                {page.kind === "cover" && (
                  <CoverPage
                    book={book}
                    entries={entries}
                    isLoading={isLoading}
                  />
                )}
                {page.kind === "recipe" && (
                  <RecipePage book={book} onEdit={() => setEditing(true)} />
                )}
                {page.kind === "journal" && (
                  <JournalList
                    entries={entries}
                    isLoading={isLoading}
                    onOpen={setOpenEntryId}
                    onAdd={() => setWriting(true)}
                  />
                )}
              </motion.div>
            </AnimatePresence>

            {/* The open entry sits OUTSIDE the scrolling page so it always covers
                the whole page area, then grows from its row via the shared layoutId */}
            <AnimatePresence>
              {page.kind === "journal" && openEntry && (
                <EntryDetail
                  key={openEntry.id}
                  entry={openEntry}
                  onBack={() => setOpenEntryId(null)}
                  onDelete={() => deleteEntry(openEntry.id)}
                />
              )}
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
            {/* Where you are: a tab per page, the current one filled; tap any to jump */}
            <nav
              aria-label="Pages"
              className="bg-base-200/70 flex gap-1 rounded-full p-1"
            >
              {pages.map((p, i) => (
                <button
                  key={p.kind}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-current={i === current ? "page" : undefined}
                  className={`relative rounded-full px-3 py-1 font-serif text-sm transition-colors ${
                    i === current
                      ? "text-primary-content"
                      : "opacity-60 hover:opacity-100"
                  }`}
                >
                  {/* The filled pill slides between tabs */}
                  {i === current && (
                    <motion.span
                      layoutId={`book-${book.id}-page-pill`}
                      className="bg-primary absolute inset-0 rounded-full shadow-sm"
                      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                    />
                  )}
                  <span className="relative">{PAGE_LABELS[p.kind]}</span>
                </button>
              ))}
            </nav>
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
