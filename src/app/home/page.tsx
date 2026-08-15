import { BookmarkPlus, ChefHat, Search, Target } from "lucide-react";
import { DownArrow } from "../../../public/assets/down-arrow";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex flex-col gap-20 pb-20">
      {/* HERO */}
      <section className="hero min-h-[50vh]">
        <div className="hero-content flex-col text-center">
          <ChefHat className="text-primary mb-4 h-16 w-16" />
          <h1 className="text-5xl leading-tight font-bold md:text-6xl">
            Cook smarter.
            <br />
            Eat better.
          </h1>
          <p className="max-w-xl py-6 text-lg opacity-80">
            Find recipes that fit your health goals, save your favorites, and
            build meal plans that actually work for you.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/search" className="btn btn-primary btn-lg gap-2">
              <Search size={20} /> Search Recipes
            </Link>
            <Link href="/sign-up" className="btn btn-outline btn-lg">
              Create Account
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURES — 3 benefit cards */}
      <section className="grid gap-6 md:grid-cols-3">
        {[
          {
            icon: Search,
            title: "Discover",
            body: "Search thousands of recipes filtered to your diet and nutrition needs.",
          },
          {
            icon: BookmarkPlus,
            title: "Save",
            body: "Build a personal library of the meals you love, one click to save.",
          },
          {
            icon: Target,
            title: "Reach Goals",
            body: "Track calories and macros so every meal moves you toward your target.",
          },
        ].map(({ icon: Icon, title, body }) => (
          <div
            key={title}
            className="card bg-base-200 p-6 text-center shadow-sm"
          >
            <Icon className="text-primary mx-auto mb-3 h-10 w-10" />
            <h3 className="text-xl font-semibold">{title}</h3>
            <p className="mt-2 opacity-70">{body}</p>
          </div>
        ))}
      </section>

      {/* CLOSING CTA */}
      <section className="bg-primary/10 rounded-2xl p-10 text-center">
        <h2 className="text-3xl font-bold">Ready to cook?</h2>
        <p className="mt-2 opacity-70">Start with your first recipe search.</p>
        <Link href="/search" className="btn btn-primary btn-lg mt-6">
          Get Started
        </Link>
      </section>
    </div>
  );
}
