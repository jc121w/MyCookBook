"use client";

import type { RecipeEntry } from "@prisma/client";
import { ChefHat } from "lucide-react";
import type { BookWithCount } from "@/app/types";
import { titleCase } from "@/lib/recipeOptions";

type CoverPageProps = {
  book: BookWithCount;
  entries: RecipeEntry[]; // newest first (the API sorts by cookedOn desc)
  isLoading: boolean;
};

export function CoverPage({ book, entries, isLoading }: CoverPageProps) {
  const story = journalStory(book, entries);

  // Your own most recent photo makes it your book; fall back to the recipe's image
  const yourPhoto = entries.find((e) => e.photoUrl)?.photoUrl ?? null;
  const coverImage = yourPhoto ?? book.image;

  // What you wrote last time (the newest entry that has notes)
  const lastNote = entries.find((e) => e.notes?.trim());

  // "Asian · Main Course" — the same categories the shelves use
  const categories = [book.cuisineType[0], book.dishType[0]]
    .filter(Boolean)
    .map((c) => titleCase(c))
    .join(" · ");

  return (
    <div className="flex flex-col items-center gap-5 pt-3 pb-4 text-center">
      {/* The photo, pinned in like a snapshot: white border, slight tilt */}
      <div className="w-[88%] -rotate-[1.5deg] bg-white p-2 pb-3 shadow-md">
        <div className="bg-base-200 aspect-[4/3] overflow-hidden">
          {coverImage ? (
            <img
              src={coverImage}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="text-base-content/25 grid h-full place-items-center">
              <ChefHat className="h-14 w-14" strokeWidth={1.5} />
            </div>
          )}
        </div>
      </div>

      <div>
        <h2 className="font-serif text-3xl leading-tight font-bold">
          {book.label}
        </h2>
        {book.source && (
          <p className="mt-1 font-serif italic opacity-60">
            from {book.source}
          </p>
        )}
        {categories && (
          <p className="mt-1.5 text-[11px] tracking-[0.2em] uppercase opacity-45">
            {categories}
          </p>
        )}
      </div>

      <Flourish />

      {isLoading ? (
        <p className="font-serif italic opacity-40">
          Turning to the first page…
        </p>
      ) : story ? (
        <>
          {/* A few numbers worth showing big, then the rest as sentences */}
          <div className="flex items-start justify-center gap-6">
            {story.highlights.map((h) => (
              <div
                key={h.caption}
                className="flex max-w-[6.5rem] flex-col items-center"
              >
                <span className="font-serif text-3xl leading-none font-semibold whitespace-nowrap">
                  {h.value}
                  {h.unit && (
                    <span className="ml-1 text-base font-normal opacity-70">
                      {h.unit}
                    </span>
                  )}
                </span>
                <span className="mt-1.5 font-serif text-sm leading-snug italic opacity-60">
                  {h.caption}
                </span>
              </div>
            ))}
          </div>

          <p className="max-w-[22rem] font-serif text-[15px] leading-relaxed opacity-80">
            {story.sentences.join(" ")}
          </p>

          {lastNote?.notes && (
            <figure className="mt-1 max-w-[22rem]">
              <blockquote className="font-serif text-[15px] leading-relaxed italic opacity-80">
                &ldquo;{excerpt(lastNote.notes, 120)}&rdquo;
              </blockquote>
              <figcaption className="mt-1 font-serif text-sm opacity-50">
                — your note, {shortDate(dayOf(lastNote.cookedOn))}
              </figcaption>
            </figure>
          )}
        </>
      ) : (
        <p className="max-w-[20rem] font-serif text-[15px] leading-relaxed italic opacity-60">
          A fresh book. Cook it once and these pages will start telling its
          story.
        </p>
      )}
    </div>
  );
}

// Trim long notes at a word boundary: "Halved the soy sauce and…"
function excerpt(text: string, max: number) {
  const clean = text.trim().replace(/\s+/g, " ");
  if (clean.length <= max) return clean;
  return (
    clean.slice(0, clean.lastIndexOf(" ", max)).replace(/[,.;:!?-]+$/, "") + "…"
  );
}

// A small ornament instead of a hard divider line
function Flourish() {
  return (
    <div aria-hidden className="flex items-center gap-3 opacity-40">
      <span className="h-px w-10 bg-current" />
      <span className="text-xs">✦</span>
      <span className="h-px w-10 bg-current" />
    </div>
  );
}

// ── Turning entries into a short story ───────────────────

const DAY = 24 * 60 * 60 * 1000;

// "2026-11-15T00:00:00.000Z" (or a Date) → midnight-UTC timestamp.
// Comparing in UTC keeps @db.Date values from shifting a day.
const dayOf = (d: Date | string) => new Date(d).getTime();
const today = () => new Date(new Date().toLocaleDateString("en-CA")).getTime(); // local today as UTC midnight

type Highlight = { value: string; unit?: string; caption: string };

function journalStory(book: BookWithCount, entries: RecipeEntry[]) {
  const cooks = entries.length;
  if (cooks === 0) return null;

  const newest = dayOf(entries[0].cookedOn);
  const oldest = dayOf(entries[cooks - 1].cookedOn);

  // Big numbers: only the ones we actually know
  const highlights = [
    {
      value: String(cooks),
      caption: cooks === 1 ? "time cooked" : "times cooked",
    },
    book.totalTime > 0 && {
      ...hours(book.totalTime * cooks),
      caption: "at the stove",
    },
    book.yield > 0 && {
      value: String(book.yield * cooks),
      caption: "servings shared",
    },
  ].filter((h): h is Highlight => Boolean(h));

  // Sentences, written the way you'd say them
  const sentences: string[] = [];
  if (cooks === 1) {
    sentences.push(`You made this on ${longDate(newest)}, ${ago(newest)}.`);
  } else {
    sentences.push(`First made on ${longDate(oldest)}.`);
    sentences.push(`Last cooked ${shortDate(newest)}, ${ago(newest)}.`);
    const gap = (newest - oldest) / DAY / (cooks - 1);
    sentences.push(`You come back to it ${rhythm(gap)}.`);
  }

  // Ratings: the average of the cooks you rated (skips unrated ones)
  const ratings = entries
    .map((e) => e.rating)
    .filter((r): r is number => r != null);
  if (ratings.length === 1) {
    sentences.push(`You gave it ${ratings[0].toFixed(1)} out of 5.`);
  } else if (ratings.length > 1) {
    const avg = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
    sentences.push(
      `On average you rate it ${(Math.round(avg * 10) / 10).toFixed(1)} out of 5.`,
    );
  }

  return { highlights, sentences };
}

// 135 → { value: "2¼", unit: "hrs" }, 45 → { value: "45", unit: "min" }
function hours(minutes: number) {
  if (minutes < 60) return { value: String(minutes), unit: "min" };
  const quarters = Math.round(minutes / 15);
  const whole = Math.floor(quarters / 4);
  const fraction = ["", "¼", "½", "¾"][quarters % 4];
  return {
    value: `${whole}${fraction}`,
    unit: whole === 1 && !fraction ? "hr" : "hrs",
  };
}

const WORDS: Record<number, string> = {
  2: "two",
  3: "three",
  4: "four",
  5: "five",
  6: "six",
  7: "seven",
  8: "eight",
  9: "nine",
};

const plural = (n: number, unit: string) =>
  n === 1 ? `a ${unit}` : `${WORDS[n] ?? n} ${unit}s`;

// timestamp → "today", "yesterday", "three days ago", "two weeks ago", "four months ago"
function ago(t: number) {
  const days = Math.round((today() - t) / DAY);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${WORDS[days] ?? days} days ago`;
  if (days < 30) return `${plural(Math.round(days / 7), "week")} ago`;
  if (days < 365) return `${plural(Math.round(days / 30), "month")} ago`;
  return `${plural(Math.round(days / 365), "year")} ago`;
}

// average days between cooks → "about every five days", "about every two weeks", "about once a month"
function rhythm(days: number) {
  if (days < 1.5) return "almost every day";
  if (days < 10)
    return `about every ${WORDS[Math.round(days)] ?? Math.round(days)} days`;
  if (days < 25) {
    const weeks = Math.round(days / 7);
    return weeks <= 1
      ? "about once a week"
      : `about every ${WORDS[weeks] ?? weeks} weeks`;
  }
  if (days < 45) return "about once a month";
  if (days < 120) return "every couple of months";
  return "every now and then";
}

// timestamp → "November 15" / "October 20, 2026"
const shortDate = (t: number) =>
  new Date(t).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
const longDate = (t: number) =>
  new Date(t).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
