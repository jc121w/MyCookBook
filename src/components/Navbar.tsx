import { NotebookText, User, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import { SignOutButton } from "./buttons/SignOutButton";
import { auth } from "@/lib/auth";

type Session = typeof auth.$Infer.Session;
export const Navbar = async ({ session }: { session: Session | null }) => {
  console.log(session);
  return (
    <div className="navbar max-h-8 border-b bg-base-100">
      <div className="navbar-start">
        {" "}
        <Link href="/" className="btn btn-ghost text-xl" prefetch={false}>
          <NotebookText className="ml-4 h-8 w-8" />
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

        {session && (
          <div className="flex items-center">
            <button className="btn btn-ghost">
              <Link href="/profile" prefetch={false}>
                <span className="font-semibold">Profile</span>
              </Link>
            </button>

            <SignOutButton />
          </div>
        )}
        {!session && (
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
