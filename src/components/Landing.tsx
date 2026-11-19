import { BookPlus, PenLine, Search } from "lucide-react";
import Link from "next/link";
import { Stars } from "@/components/journal/StarRating";

// The landing page. Signed out: invite them to make an account.
// Signed in: skip the pitch's call-to-action and take them to their shelf.
export function Landing({ signedIn }: { signedIn: boolean }) {
  return (
    <div className="flex flex-col gap-20">
      {/* ── Hero: what it is, in one line, and a picture of it ── */}
      <section className="grid items-center gap-12 md:grid-cols-2">
        <div className="flex flex-col items-center gap-5 text-center md:items-start md:text-left">
          <p className="text-xs font-semibold tracking-widest uppercase opacity-60">
            A cooking journal
          </p>
          <h1 className="font-serif text-5xl leading-[1.05] font-bold md:text-6xl">
            Every dish you make, in one book.
          </h1>
          <p className="max-w-md font-serif text-lg leading-relaxed opacity-75">
            Find recipes, keep them on your shelf, and log each time you cook
            them, with a photo, a note and a rating.
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-3 md:justify-start">
            {signedIn ? (
              <>
                <Link
                  href="/library"
                  className="btn btn-primary btn-lg font-serif"
                >
                  Open your shelf
                </Link>
                <Link
                  href="/search"
                  className="btn btn-ghost btn-lg gap-2 font-serif font-normal"
                >
                  <Search className="h-5 w-5" /> Find a recipe
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/sign-up"
                  className="btn btn-primary btn-lg font-serif"
                >
                  Create a free account
                </Link>
                <Link
                  href="/search"
                  className="btn btn-ghost btn-lg gap-2 font-serif font-normal"
                >
                  <Search className="h-5 w-5" /> Browse recipes
                </Link>
              </>
            )}
          </div>
          {!signedIn && (
            <p className="text-sm opacity-55">
              Already have one?{" "}
              <Link href="/sign-in" className="link link-hover">
                Sign in
              </Link>
            </p>
          )}
        </div>

        <HeroArt />
      </section>

      {/* ── How it works: three steps ── */}
      <section className="flex flex-col gap-8">
        <h2 className="text-center font-serif text-3xl font-bold">
          How it works
        </h2>
        <ol className="grid gap-6 md:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, body }, i) => (
            <li
              key={title}
              className="bg-base-200/60 flex flex-col gap-3 rounded-2xl p-6"
            >
              <span className="flex items-center gap-3">
                <span className="bg-primary/15 text-primary grid h-10 w-10 place-items-center rounded-full">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="font-serif text-sm italic opacity-50">
                  Step {i + 1}
                </span>
              </span>
              <h3 className="font-serif text-xl font-semibold">{title}</h3>
              <p className="leading-relaxed opacity-70">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Closing invite (signed out only) ── */}
      {!signedIn && (
        <section className="bg-base-200/60 flex flex-col items-center gap-4 rounded-3xl px-6 py-12 text-center">
          <h2 className="font-serif text-3xl font-bold">
            Start your cookbook.
          </h2>
          <p className="max-w-md opacity-70">
            Free, and your journal is private to you.
          </p>
          <Link
            href="/sign-up"
            className="btn btn-primary btn-lg mt-2 font-serif"
          >
            Create a free account
          </Link>
        </section>
      )}
    </div>
  );
}

const STEPS = [
  {
    icon: Search,
    title: "Find",
    body: "Search thousands of recipes by dish, ingredient or cuisine.",
  },
  {
    icon: BookPlus,
    title: "Shelve",
    body: "Add the ones you'll cook, or write down your own.",
  },
  {
    icon: PenLine,
    title: "Log",
    body: "After each cook, add a page: a photo, how it went, a rating.",
  },
];

// A drawn preview of the app: a little shelf of cookbooks, with a journal entry in front
function HeroArt() {
  const spines = [
    { bg: "#b5562f", h: 150, w: 34 },
    { bg: "#7d8b6a", h: 168, w: 40 },
    { bg: "#c99a3c", h: 140, w: 30 },
    { bg: "#efe4cf", h: 160, w: 38 },
    { bg: "#6b4a3a", h: 172, w: 42 },
    { bg: "#c08a7d", h: 148, w: 32 },
    { bg: "#5f6b3c", h: 162, w: 36 },
  ];

  return (
    <div
      aria-hidden
      className="relative mx-auto h-[300px] w-full max-w-[420px]"
    >
      {/* The shelf */}
      <div
        className="absolute inset-x-0 top-4 rounded-md p-2.5 shadow-xl"
        style={{ background: "linear-gradient(180deg, #b07c4f, #94643d)" }}
      >
        <div
          className="flex h-[190px] items-end gap-[3px] rounded-sm px-4"
          style={{ background: "linear-gradient(180deg, #5a3f2c, #6e4f37)" }}
        >
          {spines.map((s, i) => (
            <span
              key={i}
              className="relative block rounded-[3px] shadow-md"
              style={{
                height: s.h,
                width: s.w,
                background: `linear-gradient(to right, rgb(0 0 0 / .25), rgb(255 255 255 / .14) 25%, transparent 55%, rgb(0 0 0 / .2)), ${s.bg}`,
              }}
            >
              {/* bands */}
              <span className="absolute inset-x-0 top-3 h-[3px] bg-white/35" />
              <span className="absolute inset-x-0 bottom-4 h-[3px] bg-white/35" />
              {i % 3 === 1 && (
                <span className="absolute -top-2.5 right-2 h-5 w-[6px] bg-[#f0c987]" />
              )}
            </span>
          ))}
        </div>
        <div
          className="h-3 rounded-b-sm"
          style={{ background: "linear-gradient(180deg, #d9a877, #a8754a)" }}
        />
      </div>

      {/* A journal entry, laid in front of the shelf */}
      <div className="absolute right-0 bottom-0 w-[210px] rotate-[3deg] bg-[#fdf8ee] p-4 text-left text-[#3b2a1a] shadow-2xl ring-1 ring-black/5">
        <p className="font-serif text-base font-bold">Sun, Nov 15</p>
        <div className="mt-1">
          <Stars value={4.5} size={13} />
        </div>
        <p className="mt-2 font-serif text-sm leading-snug italic opacity-80">
          &ldquo;Halved the soy sauce and added lime. Much better.&rdquo;
        </p>
        <p className="mt-2 font-serif text-xs opacity-50">
          — Pad Thai, cooked 4 times
        </p>
      </div>
    </div>
  );
}
