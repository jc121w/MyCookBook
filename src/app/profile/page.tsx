import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CircleUser, BookmarkCheck, Settings } from "lucide-react";
import { SignOutButton } from "@/components/buttons/SignOutButton";

export default async function ProfilePage() {
  // Server-side: read the session directly
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in"); // auth gate — bounce logged-out users

  const { name, email, image } = session.user;
  const savedCount = await prisma.recipe.count({
    where: { userId: session.user.id }, // real data, scoped to this user
  });

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 py-10">
      {/* Identity header */}
      <div className="bg-base-200 flex flex-col items-center gap-4 rounded-2xl p-8 text-center">
        <div className="avatar">
          <div className="ring-primary ring-offset-base-100 w-24 rounded-full ring ring-offset-2">
            {image ? (
              <img src={image} alt={name} />
            ) : (
              <CircleUser className="h-24 w-24" />
            )}
          </div>
        </div>
        <h1 className="text-2xl font-bold">{name}</h1>
        <p className="opacity-70">{email}</p>
      </div>

      {/* Stats */}
      <div className="stats stats-vertical sm:stats-horizontal w-full shadow">
        <div className="stat">
          <div className="stat-figure text-primary">
            <BookmarkCheck />
          </div>
          <div className="stat-title">Saved Recipes</div>
          <div className="stat-value text-primary">{savedCount}</div>
          <div className="stat-desc">in your library</div>
        </div>
      </div>

      {/* Action cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/library"
          className="card bg-base-200 hover:bg-base-300 p-6 transition"
        >
          <BookmarkCheck className="text-primary mb-2" />
          <h3 className="font-semibold">My Library</h3>
          <p className="text-sm opacity-70">View your saved recipes</p>
        </Link>
        <div className="card bg-base-200 p-6">
          <Settings className="text-primary mb-2" />
          <h3 className="font-semibold">Account</h3>
          <div className="mt-3">
            <SignOutButton />
          </div>
        </div>
      </div>
    </div>
  );
}
