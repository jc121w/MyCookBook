import { NotebookText, User, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import { SignOutButton } from "../buttons/SignOutButton";
import { auth } from "@/lib/auth";
import ThemeSwitcher from "../ThemeSwitcher";

type Session = typeof auth.$Infer.Session;
export const Navbar = async ({ session }: { session: Session | null }) => {
  console.log(session);
  return (
    <div className="navbar max-h-8 border-b bg-base-100 p-6 px-8 md:px-20">
      <div className="navbar-start"></div>
      <div className="navbar-center">
        {" "}
        <Link href="/" className="btn btn-ghost text-xl" prefetch={false}>
          <NotebookText className="ml-4 h-8 w-8" />
          MyCookBook
        </Link>
      </div>
      <div className="navbar-end">
        <ThemeSwitcher />
      </div>
    </div>
  );
};
