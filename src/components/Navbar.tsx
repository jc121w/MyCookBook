import { NotebookText, User, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import React from "react";

const Navbar = () => {
  return (
    <div className="navbar bg-base-100 border-b max-h-8">
      <div className="navbar-start">
        {" "}
        <Link href="/" className="btn btn-ghost text-xl">
          <NotebookText className="ml-4 w-8 h-8" />
          MyCookBook
        </Link>
      </div>
      <div className="navbar-center"></div>
      <div className="navbar-end">
        <button className="btn btn-ghost">
          <Link href="/user-recipes" className="flex items-center gap-2">
            <UtensilsCrossed />
            <span className="font-semibold">Library</span>
          </Link>
        </button>

        <div className="collapse bg-base-200 w-fit ">
          <input type="checkbox" />
          <div className="collapse-title font-semibold flex gap-2">
            {" "}
            <User />
            Username
          </div>
          <div className="collapse-content">
            <Link href="/profile" className="flex items-center gap-2">
              Profile
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
