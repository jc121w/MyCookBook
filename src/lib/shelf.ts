// The shelf's search, filters and "What should I cook?" logic.
// Pure functions over the books from GET /api/library (no React, no fetching),
// so each piece is easy to read and to test on its own.
import type { BookWithCount } from "@/app/types";

const DAY = 24 * 60 * 60 * 1000;

// ── A book's cooking history, summarized ──
export type BookStats = {
  cooks: number;
  lastCooked: number | null; // timestamp (midnight UTC, like @db.Date)
  avgRating: number | null; // of the cooks you rated, to one decimal
};

export function bookStats(book: BookWithCount): BookStats {
  const dates = book.entries.map((e) => new Date(e.cookedOn).getTime());
  const ratings = book.entries
    .map((e) => e.rating)
    .filter((r): r is number => r != null);
  return {
    cooks: book.entries.length,
    lastCooked: dates.length ? Math.max(...dates) : null,
    avgRating: ratings.length
      ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) /
        10
      : null,
  };
}

// A book's tags. Normally always a list, but a server running an older Prisma client
// (before the tags column existed) sends none, so treat missing as "no tags"
export const tagsOf = (book: BookWithCount): string[] => book.tags ?? [];

// ── Filters ──
// "all" plus the built-in ones; a user's tag is filtered as "tag:Weeknight"
export type ShelfFilter = "all" | "month" | "rated" | "never" | `tag:${string}`;

export const BUILT_IN_FILTERS: { value: ShelfFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "month", label: "Cooked this month" },
  { value: "rated", label: "Rated 4+" },
  { value: "never", label: "Never cooked" },
];

export function matchesFilter(
  book: BookWithCount,
  filter: ShelfFilter,
  now = new Date(),
) {
  const stats = bookStats(book);
  if (filter === "all") return true;
  if (filter === "never") return stats.cooks === 0;
  if (filter === "rated")
    return stats.avgRating != null && stats.avgRating >= 4;
  if (filter === "month") {
    // Any cook in this calendar month (cookedOn is a UTC date)
    return book.entries.some((e) => {
      const d = new Date(e.cookedOn);
      return (
        d.getUTCFullYear() === now.getFullYear() &&
        d.getUTCMonth() === now.getMonth()
      );
    });
  }
  // A tag (case-insensitive)
  const tag = filter.slice(4).toLowerCase();
  return tagsOf(book).some((t) => t.toLowerCase() === tag);
}

// Search by name, source, or tag ("thai", "serious eats", "weeknight")
export function matchesSearch(book: BookWithCount, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [book.label, book.source ?? "", ...tagsOf(book)].some((text) =>
    text.toLowerCase().includes(q),
  );
}

// Every tag on the shelf, A–Z, without case duplicates
export function allTags(books: BookWithCount[]) {
  const seen = new Map<string, string>();
  for (const book of books)
    for (const tag of tagsOf(book))
      if (!seen.has(tag.toLowerCase())) seen.set(tag.toLowerCase(), tag);
  return [...seen.values()].sort((a, b) => a.localeCompare(b));
}

// ── "What should I cook?" ──
// Not used right now (the button was removed); kept so it's easy to bring back.
export type Suggestion = { book: BookWithCount; reason: string };

// Favors recipes you rated highly and haven't made in a while. Skips anything cooked
// in the last 5 days, picks at random among the best few (so "Another" gives you
// something different). Nothing qualifies → null.
// "The best few" = within 1.5 points of the top score.
export function suggestBook(
  books: BookWithCount[],
  skip: number[] = [], // ids already suggested this round
  now = Date.now(),
): Suggestion | null {
  const pool = books.filter((b) => !skip.includes(b.id));
  if (pool.length === 0) return null;

  const scored = pool
    .map((book) => ({ book, stats: bookStats(book) }))
    .filter(
      ({ stats }) =>
        stats.lastCooked != null &&
        now - stats.lastCooked >= 5 * DAY && // not made in the last 5 days
        (stats.avgRating == null || stats.avgRating >= 3), // and you didn't dislike it
    )
    .map(({ book, stats }) => {
      const daysAgo = Math.floor((now - stats.lastCooked!) / DAY);
      const rating = stats.avgRating ?? 3; // unrated counts as "fine"
      // Rating matters most; time away adds up to 2 points (maxing out at ~2 months)
      const score = rating + Math.min(daysAgo / 30, 2);
      return { book, stats, daysAgo, score };
    })
    .sort((a, b) => b.score - a.score);

  if (scored.length > 0) {
    // Pick at random among the strong candidates only: within 1.5 points of the best
    // (so a 2.5-star dish never comes up just because it's one of three)
    const strong = scored.filter((c) => c.score >= scored[0].score - 1.5);
    const pick = strong[Math.floor(Math.random() * strong.length)];
    const parts = [
      pick.stats.avgRating != null
        ? `You rated it ${pick.stats.avgRating.toFixed(1)}`
        : `You've made it ${pick.stats.cooks === 1 ? "once" : `${pick.stats.cooks} times`}`,
      `last made ${sinceText(pick.daysAgo)}`,
    ];
    return { book: pick.book, reason: parts.join(" · ") };
  }

  return null;
}

function sinceText(days: number) {
  if (days < 14) return `${days} days ago`;
  if (days < 60) return `${Math.round(days / 7)} weeks ago`;
  if (days < 365) return `${Math.round(days / 30)} months ago`;
  return "over a year ago";
}
