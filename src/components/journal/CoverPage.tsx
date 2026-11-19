"use client";

import type { RecipeEntry } from "@prisma/client";
import {
  CalendarCheck,
  CalendarClock,
  CalendarPlus,
  ChefHat,
  Clock,
  Repeat,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { BookWithCount } from "@/app/types";

type CoverPageProps = {
  book: BookWithCount;
  entries: RecipeEntry[]; // newest first (the API sorts by cookedOn desc)
  isLoading: boolean;
};

export function CoverPage({ book, entries, isLoading }: CoverPageProps) {
  const stats = journalStats(book, entries);

  return (
    <div className="flex flex-col items-center gap-4 pt-1 pb-2 text-center">
      <div className="bg-base-200 aspect-[16/10] w-full shrink-0 overflow-hidden rounded-lg">
        {book.image ? (
          <img src={book.image} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="text-base-content/25 grid h-full place-items-center">
            <ChefHat className="h-14 w-14" strokeWidth={1.5} />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <h2 className="font-serif text-3xl leading-tight font-bold">
          {book.label}
        </h2>
        {book.source && <p className="text-sm opacity-60">{book.source}</p>}
      </div>

      <div className="w-full">
        <div className="mb-2 flex items-baseline justify-between">
          <p className="text-xs font-semibold tracking-widest uppercase opacity-60">
            Your journal
          </p>
          {stats.cooks === 0 && !isLoading && (
            <p className="text-xs italic opacity-50">
              Log a cook to start your stats
            </p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Stat
            icon={Repeat}
            label="Times cooked"
            value={String(stats.cooks)}
          />
          <Stat icon={Clock} label="Kitchen time" value={stats.kitchenTime} />
          <Stat icon={Users} label="Servings made" value={stats.servings} />
          <Stat
            icon={CalendarCheck}
            label="Last cooked"
            value={stats.last}
            sub={stats.lastAgo}
          />
          <Stat
            icon={CalendarPlus}
            label="First cooked"
            value={stats.first}
            sub={stats.firstYear}
          />
          <Stat
            icon={CalendarClock}
            label="Cook it"
            value={stats.rhythm}
            sub={stats.rhythmSub}
          />
        </div>
      </div>
    </div>
  );
}

// Every tile has the same shape, so the grid stays even whether values exist or not.
function Stat({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  sub?: string;
}) {
  const empty = value === "—";
  return (
    <div className="border-base-300 flex flex-col items-center gap-0.5 rounded-lg border px-1.5 py-2.5">
      <Icon className="h-3.5 w-3.5 opacity-40" />
      <p
        className={`font-serif text-lg leading-tight font-semibold ${empty ? "opacity-30" : ""}`}
      >
        {value}
      </p>
      <p className="text-[11px] leading-tight opacity-60">{label}</p>
      {/* Reserve the line even when empty so all tiles in a row match height */}
      <p className="h-3.5 text-[10px] leading-tight opacity-40">{sub ?? ""}</p>
    </div>
  );
}

// ── Stats ────────────────────────────────────────────────

const DAY = 24 * 60 * 60 * 1000;

// "2026-11-15T00:00:00.000Z" (or a Date) → midnight UTC timestamp.
// Comparing everything in UTC keeps @db.Date values from shifting a day.
const dayOf = (d: Date | string) => new Date(d).getTime();
const today = () => new Date(new Date().toLocaleDateString("en-CA")).getTime(); // local today, as UTC midnight

function journalStats(book: BookWithCount, entries: RecipeEntry[]) {
  const cooks = entries.length;
  const none = {
    cooks,
    kitchenTime: "—",
    servings: "—",
    last: "—",
    first: "—",
    rhythm: "—",
    lastAgo: undefined,
    firstYear: undefined,
    rhythmSub: "after 2 cooks",
  };
  if (cooks === 0) return none;

  const newest = dayOf(entries[0].cookedOn);
  const oldest = dayOf(entries[cooks - 1].cookedOn);
  const daysAgo = Math.round((today() - newest) / DAY);

  // Average days between cooks needs at least two
  const avgGap = cooks >= 2 ? (newest - oldest) / DAY / (cooks - 1) : null;

  return {
    cooks,
    kitchenTime: book.totalTime > 0 ? duration(book.totalTime * cooks) : "—",
    servings: book.yield > 0 ? String(book.yield * cooks) : "—",
    last: shortDate(newest),
    lastAgo:
      daysAgo === 0
        ? "today"
        : daysAgo === 1
          ? "yesterday"
          : `${daysAgo} days ago`,
    first: shortDate(oldest),
    firstYear: String(new Date(oldest).getUTCFullYear()),
    rhythm: avgGap != null ? every(avgGap) : "—",
    rhythmSub: avgGap != null ? "on average" : "after 2 cooks",
  };
}

// 405 → "6h 45m", 40 → "40m"
function duration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

// timestamp → "Nov 15"
function shortDate(t: number) {
  return new Date(t).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

// average gap in days → "Every 5d" / "Every 3w" / "Every 2mo"
function every(days: number) {
  if (days < 1) return "Daily";
  if (days < 14) return `Every ${Math.round(days)}d`;
  if (days < 60) return `Every ${Math.round(days / 7)}w`;
  return `Every ${Math.round(days / 30)}mo`;
}
