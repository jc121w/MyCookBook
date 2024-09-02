import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { motion } from "framer-motion";
import { DownArrow } from "../../public/assets/down-arrow";
import { Search } from "lucide-react";
import Link from "next/link";

const downButtonVariants = {
  animateDown: {
    y: 100,
    opacity: [0, 0.1, 0.3, 0.5, 0.7, 1, 1, 0],

    transition: {
      delay: 5,
      repeat: Infinity,
      ease: "easeInOut",
      times: [0, 0.2, 0.4, 0.5, 0.6, 0.7, 0.9, 1],
      duration: 2,
    },
    initial: { y: 0, opacity: 0 },
  },
};
export default async function Home({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const session = await getServerSession(authOptions);
  return (
    <main className=" max-w-4xl flex flex-col items-center m-auto h-screen  gap-10">
      <h3 className="p-5 text-4xl font-bold">
        Welcome {session?.user ? session.user.name?.split(" ")[0] : ""}
      </h3>
      <p className="prose-lg prose ">
        {" "}
        MyCookBook is a recipe finder / meal plan builder. Users can search for
        and create recipes to craft a meal plan that fits their fitness and
        health needs.{" "}
      </p>
      <div className="flex flex-col gap-3 ">
        {" "}
        <span className="underline text-center p-3 font-semibold text-xl">
          {" "}
          Current Features
        </span>
        <span> • Search Recipes from Spoontacular API</span>
        <span> • Add Recipes to personal library</span>
        <span> • User Sign In / Authentication with NextAuth</span>
        <span className="underline text-center font-semibold text-xl p-3">
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
        <Search className="mt-16 w-14 h-14 cursor-pointer hover:scale-125 transition-transform duration-200" />
      </Link>
    </main>
  );
}
