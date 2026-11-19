import { auth } from "@/lib/auth";
import { getKitchenStats, type KitchenStats } from "@/lib/kitchenStats";
import { titleCase } from "@/lib/recipeOptions";
import { Stars } from "@/components/journal/StarRating";
import { SignOutButton } from "@/components/buttons/SignOutButton";
import { Avatar } from "@/components/Avatar";
import {
  BookOpen,
  Camera,
  ChefHat,
  Clock,
  CookingPot,
  Settings,
} from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

// A server component: it reads the session and the database directly, no API route needed
export default async function ProfilePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  const { name, email, image } = session.user;
  const stats = await getKitchenStats(session.user.id);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-4 py-10">
      {/* ── Who ── */}
      <header className="flex flex-col items-center gap-3 text-center">
        {/* Your photo (or initial) in a soft double ring, like a framed portrait */}
        <span className="ring-base-100 bg-base-300/60 rounded-full p-1.5 shadow-md ring-4">
          <Avatar name={name} image={image} size={104} />
        </span>
        <div>
          <h1 className="font-serif text-3xl font-bold">{name}</h1>
          <p className="mt-1 font-serif italic opacity-60">
            {stats.firstCook
              ? `Cooking since ${monthYear(stats.firstCook)}`
              : "Your kitchen journal starts here"}
          </p>
        </div>
      </header>

      {stats.meals === 0 ? (
        <EmptyKitchen books={stats.books} />
      ) : (
        <>
          <Highlights stats={stats} />
          <Story stats={stats} />

          <div className="grid gap-6 sm:grid-cols-2">
            {stats.favorite && <Favorite favorite={stats.favorite} />}
            <OnRepeat recipes={stats.mostCooked} />
          </div>

          <AverageMeal nutrition={stats.nutrition} />
        </>
      )}

      {/* ── Footer: a link to your shelf, then account things, quietly ── */}
      <footer className="border-base-300 flex flex-col items-center gap-5 border-t pt-6">
        <Link
          href="/library"
          className="btn btn-ghost btn-sm gap-1.5 font-serif font-normal"
        >
          <BookOpen className="h-4 w-4" /> Your shelf
        </Link>
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs">
          <span className="opacity-50">Signed in as {email}</span>
          <span aria-hidden className="opacity-30">
            ·
          </span>
          {/* The button is styled for the sidebar; this makes it a small text link */}
          <span className="link link-hover opacity-70 hover:opacity-100 [&_svg]:hidden [&>div]:inline">
            <SignOutButton />
          </span>
        </div>
      </footer>
    </div>
  );
}

// ── Pieces ───────────────────────────────────────────────

const Label = ({ children }: { children: React.ReactNode }) => (
  <p className="text-xs font-semibold tracking-widest uppercase opacity-60">
    {children}
  </p>
);

// Four stats, each in its own tile: icon, number, then its label right underneath,
// so every label clearly belongs to the number above it
function Highlights({ stats }: { stats: KitchenStats }) {
  const items = [
    {
      icon: CookingPot,
      value: stats.meals,
      label: stats.meals === 1 ? "meal cooked" : "meals cooked",
    },
    {
      icon: BookOpen,
      value: stats.books,
      label:
        stats.books === 1 ? "recipe on your shelf" : "recipes on your shelf",
    },
    { icon: Clock, value: stats.hours, label: "hours at the stove" },
    {
      icon: Camera,
      value: stats.photos,
      label: stats.photos === 1 ? "photo taken" : "photos taken",
    },
  ];
  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map(({ icon: Icon, value, label }) => (
        <div
          key={label}
          className="bg-base-200/60 border-base-300/70 flex flex-col items-center gap-1 rounded-2xl border px-3 py-5 text-center"
        >
          <Icon className="text-primary/70 mb-1 h-5 w-5" strokeWidth={1.75} />
          <span className="font-serif text-4xl leading-none font-bold tabular-nums">
            {value.toLocaleString()}
          </span>
          <span className="text-xs leading-snug font-medium tracking-wide uppercase opacity-60">
            {label}
          </span>
        </div>
      ))}
    </section>
  );
}

// The key facts in the story, highlighted so they stand out from the sentence
const Em = ({ children }: { children: React.ReactNode }) => (
  <strong className="text-primary font-semibold">{children}</strong>
);

// The numbers, said the way you'd say them, with the facts that matter highlighted
function Story({ stats }: { stats: KitchenStats }) {
  return (
    <p className="mx-auto max-w-xl text-center font-serif text-lg leading-relaxed opacity-90">
      You&apos;ve cooked <Em>{count(stats.meals, "meal")}</Em> from{" "}
      <Em>{count(stats.cookedRecipes, "recipe")}</Em>.
      {stats.topCuisine && (
        <>
          {" "}
          Your go-to cuisine is <Em>{titleCase(stats.topCuisine)}</Em>.
        </>
      )}{" "}
      {stats.thisMonth > 0 ? (
        <>
          This month you&apos;ve been in the kitchen{" "}
          <Em>{count(stats.thisMonth, "time")}</Em>.
        </>
      ) : (
        <>Nothing logged this month yet.</>
      )}
      {stats.avgRating != null && (
        <>
          {" "}
          On average you rate your cooking{" "}
          <Em>{stats.avgRating.toFixed(1)} out of 5</Em>.
        </>
      )}
    </p>
  );
}

type Cooked = NonNullable<KitchenStats["favorite"]>;

function Favorite({ favorite }: { favorite: Cooked }) {
  return (
    <section className="flex flex-col gap-3">
      <Label>Your favorite</Label>
      <Link
        href={`/library?book=${favorite.id}`}
        className="group flex flex-col gap-3"
      >
        <span className="-rotate-1 bg-white p-2 pb-3 shadow-md transition-transform group-hover:rotate-0">
          {favorite.photo ? (
            <img
              src={favorite.photo}
              alt=""
              className="aspect-[4/3] w-full object-cover"
            />
          ) : (
            <span className="bg-base-200 text-base-content/25 grid aspect-[4/3] w-full place-items-center">
              <ChefHat className="h-12 w-12" strokeWidth={1.5} />
            </span>
          )}
        </span>
        <span>
          <span className="block font-serif text-2xl leading-tight font-bold group-hover:underline">
            {favorite.label}
          </span>
          <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            {favorite.avgRating != null && (
              <Stars value={favorite.avgRating} size={14} />
            )}
            <span className="font-serif italic opacity-60">
              cooked {count(favorite.cooks, "time")}
              {favorite.source ? ` · from ${favorite.source}` : ""}
            </span>
          </span>
        </span>
      </Link>
    </section>
  );
}

// Your most-cooked recipes, with a quiet bar showing how often
function OnRepeat({ recipes }: { recipes: Cooked[] }) {
  const most = recipes[0]?.cooks ?? 1;
  return (
    <section className="flex flex-col gap-3">
      <Label>On repeat</Label>
      <ol className="flex flex-col gap-4">
        {recipes.map((r, i) => (
          <li key={r.id}>
            <Link
              href={`/library?book=${r.id}`}
              className="hover:bg-base-200/60 -mx-2 flex items-center gap-3 rounded-lg px-2 py-1 transition-colors"
            >
              <span className="w-4 font-serif text-lg font-bold opacity-40">
                {i + 1}
              </span>
              {r.photo ? (
                <img
                  src={r.photo}
                  alt=""
                  className="h-12 w-12 shrink-0 rounded-md object-cover shadow-sm"
                />
              ) : (
                <span className="bg-base-200 text-base-content/30 grid h-12 w-12 shrink-0 place-items-center rounded-md">
                  <ChefHat className="h-5 w-5" strokeWidth={1.5} />
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate font-serif font-semibold">
                  {r.label}
                </span>
                <span className="mt-1 flex items-center gap-2">
                  <span className="bg-base-300 h-1.5 flex-1 overflow-hidden rounded-full">
                    <span
                      className="bg-primary/70 block h-full rounded-full"
                      style={{ width: `${(r.cooks / most) * 100}%` }}
                    />
                  </span>
                  <span className="font-serif text-xs whitespace-nowrap italic opacity-60">
                    {count(r.cooks, "time")}
                  </span>
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

function AverageMeal({ nutrition }: { nutrition: KitchenStats["nutrition"] }) {
  const items = [
    { label: "calories", value: nutrition.calories, unit: "" },
    { label: "protein", value: nutrition.protein, unit: "g" },
    { label: "carbs", value: nutrition.carbs, unit: "g" },
    { label: "fat", value: nutrition.fat, unit: "g" },
  ].filter((i) => i.value != null);
  if (items.length === 0) return null;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-3">
        <Label>An average meal you cook</Label>
        <span className="font-serif text-xs italic opacity-50">
          per serving, across every cook you&apos;ve logged
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {items.map((i) => (
          <div
            key={i.label}
            className="border-base-300 rounded-xl border px-3 py-4 text-center"
          >
            <span className="font-serif text-3xl font-bold tabular-nums">
              {i.value}
              {i.unit && (
                <span className="ml-0.5 text-base font-normal opacity-60">
                  {i.unit}
                </span>
              )}
            </span>
            <span className="mt-1 block font-serif text-sm italic opacity-60">
              {i.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function EmptyKitchen({ books }: { books: number }) {
  return (
    <section className="bg-base-200/60 flex flex-col items-center gap-3 rounded-2xl px-6 py-12 text-center">
      <ChefHat className="h-10 w-10 opacity-40" strokeWidth={1.5} />
      <p className="max-w-sm font-serif text-lg leading-relaxed">
        {books > 0
          ? "Your shelf is ready. Cook something and add a page — your stats will grow from there."
          : "Your kitchen story starts with your first recipe."}
      </p>
      <Link
        href={books > 0 ? "/library" : "/search"}
        className="btn btn-primary btn-sm mt-2 font-serif"
      >
        {books > 0 ? "Open your shelf" : "Find a recipe"}
      </Link>
    </section>
  );
}

// ── Wording helpers ──

const WORDS = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
];
// count(3, "meal") → "three meals", count(1, "time") → "once"-style "one time", 12 → "12 meals"
function count(n: number, noun: string) {
  const word = n < 10 ? WORDS[n] : n.toLocaleString();
  return `${word} ${noun}${n === 1 ? "" : "s"}`;
}

const monthYear = (d: Date) =>
  d.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
