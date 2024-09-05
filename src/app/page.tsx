import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

import { DownArrow } from "../../public/assets/down-arrow";
import { Search } from "lucide-react";
import Link from "next/link";

export default async function Home() {
  const session = await getServerSession(authOptions);
  return (
    <main className="m-auto flex h-screen max-w-4xl flex-col items-center gap-10">
      <h3 className="p-5 text-4xl font-bold">
        Welcome{" "}
        {session?.user
          ? session.user.name?.split(" ")[0] ||
            session.user.username?.split(" ")[0]
          : "Guest"}
      </h3>
      <p className="prose prose-xl">
        {" "}
        MyCookBook is a recipe finder / meal plan builder. Users can search for
        and create recipes to craft a meal plan that fits their fitness and
        health needs.{" "}
      </p>
      <div className="flex flex-col gap-3">
        {" "}
        <span className="p-3 text-center text-xl font-semibold underline">
          {" "}
          Current Features
        </span>
        <span> • Search Recipes from Spoontacular API</span>
        <span> • Add Recipes to personal library</span>
        <span> • User Sign In / Authentication with NextAuth</span>
        <span className="p-3 text-center text-xl font-semibold underline">
          {" "}
          In-Progress
        </span>
        <span>
          {" "}
          • Personalized Profile Page that features tracking nutrients and
          progress towards a nutrient goal
        </span>
        <span> • Adding own recipes to library</span>
        <span> • In-depth filter system (by nutrients, price, etc.)</span>
        <span> • General design and aesthetic improvements / polishing </span>
      </div>
      <span className="text-lg">Thanks for visiting my app.</span>
      <p className="text-lg">Begin by searching your first recipe</p>

      <DownArrow />
      <Link href="/search">
        <Search className="mt-16 h-14 w-14 cursor-pointer transition-transform duration-200 hover:scale-125" />
      </Link>
    </main>
  );
}
