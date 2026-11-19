"use client";

import type { RecipeEntry } from "@prisma/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { ChevronLeft, PenLine } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { ConfirmDelete } from "./ConfirmDelete";
import { StarInput, Stars } from "./StarRating";

const EASE = [0.4, 0, 0.2, 1] as const;
// The entry → full-page grow, and back. Same timing both ways, no bounce.
const GROW = { layout: { duration: 0.35, ease: EASE } };

// After axios, cookedOn is a string even though the type says Date; new Date() handles both.
// timeZone "UTC" everywhere because @db.Date is stored as midnight UTC (else: a day early).
const fmt = (d: Date | string, options: Intl.DateTimeFormatOptions) =>
  new Date(d).toLocaleDateString(undefined, { ...options, timeZone: "UTC" });

// ── The journal ──────────────────────────────────────────

type JournalListProps = {
  entries: RecipeEntry[]; // newest first
  isLoading: boolean;
  onOpen: (entryId: number) => void;
  onAdd: () => void;
};

export function JournalList({
  entries,
  isLoading,
  onOpen,
  onAdd,
}: JournalListProps) {
  if (isLoading) {
    return (
      <p className="pt-8 text-center font-serif italic opacity-40">
        Opening your journal…
      </p>
    );
  }

  // Group by month: [["November 2026", [...]], ["October 2026", [...]]]
  const months = new Map<string, RecipeEntry[]>();
  for (const entry of entries) {
    const month = fmt(entry.cookedOn, { month: "long", year: "numeric" });
    months.set(month, [...(months.get(month) ?? []), entry]);
  }
  const groups = [...months];

  return (
    <div className="flex flex-col gap-6 pt-2">
      <div className="flex items-baseline justify-between">
        <p className="text-xs font-semibold tracking-widest uppercase opacity-60">
          Your journal
        </p>
        <p className="font-serif text-sm italic opacity-50">
          {entries.length === 0
            ? "nothing written yet"
            : `${entries.length} ${entries.length === 1 ? "entry" : "entries"}`}
        </p>
      </div>

      {/* No entries yet: the blank page is the whole journal */}
      {groups.length === 0 && (
        <ul className="grid grid-cols-2 gap-x-5 gap-y-6">
          <li>
            <NewEntryCard onClick={onAdd} />
          </li>
        </ul>
      )}

      {groups.map(([month, monthEntries], i) => (
        <section key={month} className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <h3 className="font-serif text-sm whitespace-nowrap italic opacity-60">
              {month}
            </h3>
            <span className="bg-base-content/15 h-px flex-1" />
          </div>
          <ul className="grid grid-cols-2 gap-x-5 gap-y-6">
            {/* The next page always leads the newest month */}
            {i === 0 && (
              <li>
                <NewEntryCard onClick={onAdd} />
              </li>
            )}
            {monthEntries.map((entry) => (
              <li key={entry.id}>
                <EntryCard entry={entry} onOpen={() => onOpen(entry.id)} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

// ── Scrapbook prints ─────────────────────────────────────

// Each print is mounted a little crooked, like it was placed by hand.
// Derived from the id, so a print keeps its tilt every render.
const TILTS = [-2, 1.5, -1, 2, 0.5, -1.5, 1, -0.5];
const tiltOf = (id: number) => TILTS[id % TILTS.length];

const INK = "#3b2a1a"; // dark brown "pen" color for captions

// Soft card colors for cooks without a photo, so each one is still recognizable
const CARD_TINTS = [
  "#f3e3c9",
  "#e5ecdc",
  "#f1dcd3",
  "#dfe6ee",
  "#eee3d0",
  "#e9dfe9",
];

// Scrapbook photo corners: four little dark triangles holding the picture down.
// clip-path cuts each square down to the triangle for its corner.
function PhotoCorners({ size = 14 }: { size?: number }) {
  const corner = "absolute bg-[#3b2a1a]/80";
  const s = { width: size, height: size };
  return (
    <>
      <span
        aria-hidden
        className={`${corner} -top-px -left-px`}
        style={{ ...s, clipPath: "polygon(0 0,100% 0,0 100%)" }}
      />
      <span
        aria-hidden
        className={`${corner} -top-px -right-px`}
        style={{ ...s, clipPath: "polygon(0 0,100% 0,100% 100%)" }}
      />
      <span
        aria-hidden
        className={`${corner} -bottom-px -left-px`}
        style={{ ...s, clipPath: "polygon(0 0,0 100%,100% 100%)" }}
      />
      <span
        aria-hidden
        className={`${corner} -right-px -bottom-px`}
        style={{ ...s, clipPath: "polygon(100% 0,100% 100%,0 100%)" }}
      />
    </>
  );
}

// Same height under every print, so the grid lines up
const CAPTION = "mt-2 flex h-[52px] w-full flex-col gap-0.5 px-1 text-left";

// The next page: a dashed print-shaped spot, dated today
function NewEntryCard({ onClick }: { onClick: () => void }) {
  // Today in the user's own time zone (this is "now", not a stored date, so no UTC)
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  return (
    <button
      type="button"
      onClick={onClick}
      className="border-base-content/20 text-base-content/60 hover:border-primary hover:text-base-content hover:bg-base-200/40 flex w-full flex-col rounded-sm border-2 border-dashed p-1.5 pb-2.5 transition-colors"
    >
      <span className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-1.5">
        <span className="grid h-10 w-10 place-items-center rounded-full border border-current">
          <PenLine className="h-4 w-4" />
        </span>
        <span className="font-serif text-base font-semibold">New entry</span>
      </span>
      <span className={`${CAPTION} items-center justify-center`}>
        <span className="font-serif text-xs italic opacity-70">{today}</span>
      </span>
    </button>
  );
}

// One cook, as a mounted print: the picture is what you recognize at a glance
function EntryCard({
  entry,
  onOpen,
}: {
  entry: RecipeEntry;
  onOpen: () => void;
}) {
  return (
    <motion.button
      layoutId={`entry-${entry.id}`} // same id as EntryDetail → it grows from this print
      transition={GROW}
      onClick={onOpen}
      whileHover={{ y: -4, rotate: 0, scale: 1.02 }}
      className="flex w-full flex-col bg-white p-1.5 pb-2.5 shadow-md ring-1 ring-black/5"
      style={{ rotate: tiltOf(entry.id), borderRadius: 2, color: INK }}
      aria-label={`Entry from ${fmt(entry.cookedOn, { month: "long", day: "numeric", year: "numeric" })}`}
    >
      <span className="relative block aspect-[4/3] w-full">
        {entry.photoUrl ? (
          <img
            src={entry.photoUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          // No photo: a soft printed card with the date big and your words on it
          <span
            className="flex h-full w-full flex-col items-center justify-center gap-1 px-3 text-center"
            style={{ background: CARD_TINTS[entry.id % CARD_TINTS.length] }}
          >
            <span className="font-serif text-3xl leading-none font-bold opacity-80">
              {fmt(entry.cookedOn, { day: "numeric" })}
            </span>
            <span className="text-[10px] tracking-[0.2em] uppercase opacity-60">
              {fmt(entry.cookedOn, { month: "short" })}
            </span>
            {entry.notes && (
              <span className="mt-1 line-clamp-2 font-serif text-[11px] leading-snug italic opacity-75">
                &ldquo;{entry.notes}&rdquo;
              </span>
            )}
          </span>
        )}
        <PhotoCorners />
      </span>

      {/* Caption, like writing under a photo in a scrapbook */}
      <span className={CAPTION}>
        <span className="font-serif text-sm leading-tight font-semibold">
          {fmt(entry.cookedOn, {
            weekday: "short",
            month: "short",
            day: "numeric",
          })}
        </span>
        {entry.rating != null ? (
          <Stars value={entry.rating} size={11} />
        ) : (
          <span className="text-[11px] italic opacity-45">Not rated yet</span>
        )}
        {entry.photoUrl && entry.notes && (
          <span className="line-clamp-1 font-serif text-xs italic opacity-65">
            {entry.notes}
          </span>
        )}
      </span>
    </motion.button>
  );
}

// The photo in the full entry, mounted the same way
function MountedPhoto({ src }: { src: string }) {
  return (
    <span className="mx-auto block w-[88%] -rotate-1 bg-white p-2 shadow-md">
      <span className="relative block">
        <img src={src} alt="" className="aspect-[4/3] w-full object-cover" />
        <PhotoCorners size={20} />
      </span>
    </span>
  );
}

// ── One entry, full size ─────────────────────────────────

type EntryDetailProps = {
  entry: RecipeEntry;
  onBack: () => void;
  onDelete: () => Promise<void>;
};

// Covers the page area; grows out of its entry in the journal (shared layoutId).
export function EntryDetail({ entry, onBack, onDelete }: EntryDetailProps) {
  // Reading is the default; Edit reveals date + notes fields, and Delete lives there
  const [editing, setEditing] = useState(false);

  return (
    <motion.div
      layoutId={`entry-${entry.id}`}
      // Start at the card's tilt and straighten while growing (no snap)
      initial={{ rotate: tiltOf(entry.id) }}
      animate={{ rotate: 0 }}
      exit={{ rotate: tiltOf(entry.id) }}
      transition={{ duration: 0.35, ease: EASE, ...GROW }}
      className="bg-base-100 absolute inset-0 z-10 overflow-y-auto"
      style={{ borderRadius: 0 }}
    >
      {/* Content fades in after the box starts growing, so text never looks stretched */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { delay: 0.12, duration: 0.2 } }}
        exit={{ opacity: 0, transition: { duration: 0.1 } }}
        className="flex flex-col gap-5 px-6 pt-1 pb-6"
      >
        <div className="-mx-3 flex items-center justify-between">
          <button
            className="btn btn-ghost btn-sm gap-1 font-serif font-normal"
            onClick={onBack}
          >
            <ChevronLeft className="h-4 w-4" /> All entries
          </button>
          {!editing && (
            <button
              className="btn btn-ghost btn-xs gap-1 font-serif font-normal opacity-60 hover:opacity-100"
              onClick={() => setEditing(true)}
            >
              <PenLine className="h-3.5 w-3.5" /> Edit
            </button>
          )}
        </div>

        {editing ? (
          <EntryEditor
            entry={entry}
            onDone={() => setEditing(false)}
            onDelete={onDelete}
          />
        ) : (
          <>
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase opacity-60">
                {fmt(entry.cookedOn, { weekday: "long" })}
              </p>
              <h3 className="font-serif text-2xl leading-tight font-bold">
                {fmt(entry.cookedOn, {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </h3>
            </div>

            <RatingEditor entry={entry} />

            {entry.photoUrl && <MountedPhoto src={entry.photoUrl} />}

            {entry.notes ? (
              <p className="font-serif text-lg leading-8 whitespace-pre-line">
                {entry.notes}
              </p>
            ) : (
              <p className="font-serif italic opacity-45">
                No notes this time, just cooked and enjoyed it.
              </p>
            )}
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

// Edit the date and notes. Delete sits here, at the bottom, away from everyday reading.
function EntryEditor({
  entry,
  onDone,
  onDelete,
}: {
  entry: RecipeEntry;
  onDone: () => void;
  onDelete: () => Promise<void>;
}) {
  const queryClient = useQueryClient();
  // The stored date as "YYYY-MM-DD" (UTC, matching @db.Date), which <input type="date"> wants
  const [cookedOn, setCookedOn] = useState(
    new Date(entry.cookedOn).toISOString().slice(0, 10),
  );
  const [notes, setNotes] = useState(entry.notes ?? "");
  const today = new Date().toLocaleDateString("en-CA"); // local today, for max

  const save = useMutation({
    mutationFn: () =>
      axios.patch(`/api/entries/${entry.id}`, { cookedOn, notes }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["entries", entry.recipeId],
        }),
        queryClient.invalidateQueries({ queryKey: ["recipes"] }),
      ]);
      onDone();
    },
  });

  return (
    <div className="flex flex-col gap-5">
      <h3 className="font-serif text-xl font-bold">Edit entry</h3>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Date cooked</span>
        <input
          type="date"
          max={today}
          className="input w-full"
          value={cookedOn}
          onChange={(e) => setCookedOn(e.target.value)}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Notes</span>
        <textarea
          rows={6}
          className="textarea w-full font-serif text-base leading-relaxed"
          placeholder="What did you change? How did it turn out?"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={5000}
        />
      </label>

      {save.isError && (
        <p className="text-error text-sm">Couldn&apos;t save. Try again.</p>
      )}

      <div className="flex justify-end gap-2">
        <button
          className="btn btn-ghost"
          onClick={onDone}
          disabled={save.isPending}
        >
          Cancel
        </button>
        <button
          className="btn btn-primary"
          onClick={() => save.mutate()}
          disabled={save.isPending || !cookedOn || cookedOn > today}
        >
          {save.isPending ? (
            <span className="loading loading-spinner loading-sm" />
          ) : (
            "Save"
          )}
        </button>
      </div>

      {/* Separated from Save/Cancel so it's never hit by accident */}
      <div className="border-base-300 mt-4 flex justify-center border-t pt-5">
        <ConfirmDelete
          label="Delete this entry"
          question="Delete this entry for good?"
          onConfirm={onDelete}
        />
      </div>
    </div>
  );
}

// Rate (or re-rate) an existing entry. Saves on its own, shortly after you stop changing it,
// so dragging across the stars doesn't send a request for every 0.1.
function RatingEditor({ entry }: { entry: RecipeEntry }) {
  const queryClient = useQueryClient();
  const [rating, setRating] = useState<number | null>(entry.rating);
  const lastSaved = useRef<number | null>(entry.rating);

  const save = useMutation({
    mutationFn: (next: number | null) =>
      axios.patch(`/api/entries/${entry.id}`, { rating: next }),
    onSuccess: (_res, next) => {
      lastSaved.current = next;
      // Refetch the book's entries: the list and the cover's average update too
      queryClient.invalidateQueries({ queryKey: ["entries", entry.recipeId] });
    },
  });

  useEffect(() => {
    if (rating === lastSaved.current) return;
    const timer = setTimeout(() => save.mutate(rating), 600);
    return () => clearTimeout(timer); // changed again before 600ms → restart the wait
    // eslint-disable-next-line react-hooks/exhaustive-deps -- save.mutate is stable
  }, [rating]);

  // Leaving the entry (‹ All entries, flipping pages, closing the book) before the
  // 600ms wait is up would cancel the timer above and lose the change. So on the way
  // out, send any unsaved rating right away. Refs, because state is stale in cleanup.
  const latest = useRef(rating);
  latest.current = rating;
  useEffect(() => {
    return () => {
      if (latest.current === lastSaved.current) return;
      axios
        .patch(`/api/entries/${entry.id}`, { rating: latest.current })
        .then(() =>
          queryClient.invalidateQueries({
            queryKey: ["entries", entry.recipeId],
          }),
        )
        .catch((error) => console.error("Saving rating failed:", error));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once, on unmount
  }, []);

  const status = save.isPending
    ? "Saving…"
    : save.isError
      ? "Couldn't save. Try again."
      : save.isSuccess && rating === lastSaved.current
        ? "Saved"
        : "";

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium opacity-60">
        {entry.rating == null && rating == null
          ? "How did it turn out?"
          : "Your rating"}
        {status && (
          <span
            className={`ml-2 font-normal ${save.isError ? "text-error" : "opacity-70"}`}
          >
            · {status}
          </span>
        )}
      </span>
      <StarInput value={rating} onChange={setRating} size={24} />
    </div>
  );
}
