"use client";

import type { RecipeEntry } from "@prisma/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { AnimatePresence, motion, type Variants } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { BookWithCount, BookWithEntries } from "@/app/types";
import axios from "axios";
import { EntryForm } from "./EntryForm";
import { KnifeCelebration } from "./KnifeCelebration";
import { createPortal, flushSync } from "react-dom";
import { CoverPage } from "./CoverPage";
import {
  DROP_IN_MS,
  EntryDetail,
  JournalList,
  NewEntrySheet,
} from "./JournalPage";
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
const PAGE_LABELS: Record<Page["kind"], string> = {
  cover: "Cover",
  recipe: "Recipe",
  journal: "Journal",
};

// Page change: the old page slides out and fades, then the new page slides in from
// the side you're heading toward. `d` is the direction: 1 = ▶, -1 = ◀.
const SLIDE = 40; // px: small, so it reads as a gentle nudge, not a big swipe
// mode="wait": the old page leaves, then the new one arrives (no overlapping text)
// Fading between the pages and a form (closing the entry form on Save or Cancel)
const SWAP = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2, ease: "easeOut" } },
  exit: { opacity: 0, transition: { duration: 0.15, ease: "easeIn" } },
} as const;
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
  const {
    data: entries = [],
    isLoading,
    isError: entriesFailed,
    refetch: refetchEntries,
  } = useQuery<RecipeEntry[]>({
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

  // After saving a cook, in order:
  //   1. the form closes (its own animation), back to the journal
  //   2. the knife celebration plays over the journal
  //   3. the new entry's card drops into the list
  //   4. it opens
  const [savedEntry, setSavedEntry] = useState<RecipeEntry | null>(null); // waiting for steps 2–4
  // Which step we're on, so each one starts only after the one before has finished
  const [step, setStep] = useState<"closing" | "celebrating" | "adding" | null>(
    null,
  );
  const [justAdded, setJustAdded] = useState<number | null>(null); // the card dropping in (step 3)
  // Until step 3, the journal leaves the new entry out, even if a refetch already brought it
  const shownEntries =
    savedEntry && justAdded === null
      ? entries.filter((e) => e.id !== savedEntry.id)
      : entries;

  function handleSaved(entry: RecipeEntry) {
    void queryClient.invalidateQueries({ queryKey: ["recipes"] }); // shelf's "Cooked N times"
    setSavedEntry(entry);
    setStep("closing");
    setWriting(false); // step 1: the form shrinks back into its card…
  }

  // …and once it's gone, step 2
  function handleSwapDone() {
    if (step !== "closing") return;
    setStep("celebrating");
    setCelebrating(true);
  }

  function handleCelebrationDone() {
    setCelebrating(false);
    setStep((s) => (s === "celebrating" ? "adding" : s)); // on to step 3
  }

  // Step 3: the celebration is over → put the entry in the journal, newest first.
  // Its card plays a drop-in (see JournalList's `justAdded`), and the refetch confirms it.
  useEffect(() => {
    if (step !== "adding" || !savedEntry || justAdded !== null) return;
    // Mark it as new first, in the same update as adding it, so its card mounts already
    // knowing to drop in
    setJustAdded(savedEntry.id);
    if (!entries.some((e) => e.id === savedEntry.id)) {
      queryClient.setQueryData<RecipeEntry[]>(
        ["entries", book.id],
        (old = []) =>
          [savedEntry, ...old].sort(
            (a, b) =>
              new Date(b.cookedOn).getTime() - new Date(a.cookedOn).getTime() ||
              b.id - a.id, // same day → the one logged last first
          ),
      );
    }
    void queryClient.invalidateQueries({ queryKey: ["entries", book.id] });
  }, [step, savedEntry, justAdded, entries, queryClient, book.id]);

  // Step 4: once the card has landed, open it
  useEffect(() => {
    if (justAdded === null || !savedEntry) return;
    const timer = setTimeout(() => {
      // flushSync applies this immediately, the way React handles a tap. Without it, the
      // update is scheduled differently and Motion's card → entry crossfade stalls.
      flushSync(() => {
        setOpenEntryId(justAdded); // grows open from its card
        setSavedEntry(null);
        setStep(null);
      });
      setJustAdded(null);
    }, DROP_IN_MS + 150);
    return () => clearTimeout(timer);
  }, [justAdded, savedEntry]);

  function go(step: 1 | -1) {
    goTo(current + step);
  }

  // Jump to any page; the slide direction follows which way you're going
  function goTo(target: number) {
    if (target < 0 || target >= pages.length || target === current) return;
    setOpenEntryId(null); // leaving the journal closes any open entry
    setWriting(false); // …and an unfinished new entry
    setPage([target, target > current ? 1 : -1]);
  }

  return (
    <div className="flex h-full flex-col">
      {/* Rendered into <body> through a portal: the open book is inside a transformed
          (animated) container, which would trap a fixed overlay inside the book */}
      {celebrating &&
        createPortal(
          <KnifeCelebration onDone={handleCelebrationDone} />,
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

      {/* Switching between the pages, the entry form and the recipe editor fades one out
          and the next in, so closing a form (Save or Cancel) never snaps */}
      <AnimatePresence mode="wait" initial={false}>
        {editing ? (
          // The same form as "Create recipe", filled in, inside the book
          <motion.div key="editing" {...SWAP} className="min-h-0 flex-1">
            <RecipeForm
              recipe={book}
              variant="panel"
              onDone={() => setEditing(false)}
            />
          </motion.div>
        ) : (
          <motion.div
            key="pages"
            {...SWAP}
            className="flex min-h-0 flex-1 flex-col"
          >
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
                      justAdded={justAdded}
                      loadFailed={entriesFailed}
                      onRetry={() => refetchEntries()}
                      entries={shownEntries}
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

              {/* The entry form grows out of the "New entry" card, and on Save or Cancel
                  shrinks back into it, just like an entry opening and closing.
                  After a Save, the celebration starts once it has shrunk away. */}
              <AnimatePresence onExitComplete={handleSwapDone}>
                {page.kind === "journal" && writing && (
                  <NewEntrySheet key="new-entry">
                    <EntryForm
                      recipeId={book.id}
                      onCancel={() => setWriting(false)}
                      onSaved={handleSaved}
                    />
                  </NewEntrySheet>
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
              <PageTabs current={current} onSelect={goTo} />
              <button
                className="btn btn-circle"
                onClick={() => go(1)}
                disabled={current === pages.length - 1}
                aria-label="Next page"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// The tab bar: one filled pill that slides to the current tab. It's an ordinary child of
// the book (no layoutId), so when the book opens it simply grows along with it instead
// of flying in on its own, and it only animates when you actually change tabs.
function PageTabs({
  current,
  onSelect,
}: {
  current: number;
  onSelect: (i: number) => void;
}) {
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  // Every tab's spot, measured once (and again if the tab sizes change). Knowing them all
  // up front means a tap slides the pill in that same render, with no measure-then-move
  // delay. offsetLeft/offsetWidth are layout sizes, unaffected by the book's opening scale.
  const [spots, setSpots] = useState<{ x: number; width: number }[]>([]);
  useLayoutEffect(() => {
    const measure = () =>
      setSpots(
        tabs.current.map((t) => ({
          x: t?.offsetLeft ?? 0,
          width: t?.offsetWidth ?? 0,
        })),
      );
    measure();
    const observer = new ResizeObserver(measure);
    tabs.current.forEach((t) => t && observer.observe(t));
    return () => observer.disconnect();
  }, []);
  const pill = spots[current];

  return (
    <nav
      aria-label="Pages"
      className="bg-base-200/70 relative flex gap-1 rounded-full p-1"
    >
      {pill && (
        <motion.span
          aria-hidden
          className="bg-primary absolute top-1 bottom-1 left-0 rounded-full shadow-sm"
          initial={false} // first placement: no animation
          animate={{ x: pill.x, width: pill.width }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        />
      )}
      {PAGES.map((p, i) => (
        <button
          key={p.kind}
          ref={(el) => {
            tabs.current[i] = el;
          }}
          type="button"
          onClick={() => onSelect(i)}
          aria-current={i === current ? "page" : undefined}
          className={`relative rounded-full px-3 py-1 font-serif text-sm transition-colors ${
            i === current
              ? "text-primary-content"
              : "opacity-60 hover:opacity-100"
          }`}
        >
          {PAGE_LABELS[p.kind]}
        </button>
      ))}
    </nav>
  );
}
