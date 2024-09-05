import { NotebookText, User, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import React from "react";
import { getServerSession } from "next-auth";
import { signIn, signOut } from "next-auth/react";
import { authOptions } from "@/lib/auth";
import { SignOutButton } from "./buttons/SignOutButton";
import Image from "next/image";
export const Navbar = async () => {
  const session = await getServerSession(authOptions);
  console.log(session);
  return (
    <div className="navbar bg-base-100 border-b max-h-8">
      <div className="navbar-start">
        {" "}
        <Link href="/" className="btn btn-ghost text-xl" prefetch={false}>
          <NotebookText className="ml-4 w-8 h-8" />
          MyCookBook
        </Link>
      </div>
      <div className="navbar-center"></div>
      <div className="navbar-end">
        <button className="btn btn-ghost">
          <Link
            href="/user-recipes"
            className="flex items-center gap-2"
            prefetch={false}
          >
            <UtensilsCrossed />
            <span className="font-semibold">Library</span>
          </Link>
        </button>

        {session?.user ? (
          <div className="flex items-center">
            <button className="btn btn-ghost">
              <Link href="/profile" prefetch={false}>
                <span className="font-semibold">Profile</span>
              </Link>
            </button>

            <SignOutButton />
          </div>
        ) : (
          <div>
            <button className="btn btn-ghost">
              <Link href="/sign-in" className="flex items-center gap-2">
                <span className="font-semibold">Sign In</span>
              </Link>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
