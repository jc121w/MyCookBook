import { Menu, NotebookText } from "lucide-react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import ThemeSwitcher from "../ThemeSwitcher";
import ProfileDropdown from "./ProfileDropdown";
import { sideBarLinks } from "@/constants/navigation";

type Session = typeof auth.$Infer.Session;

// links defined once, rendered wherever needed
function NavLinks({ session }: { session: Session | null }) {
  if (!session) return null;

  return (
    <>
      {sideBarLinks.map(({ href, label, icon: Icon }) => (
        <li key={href}>
          <Link href={href}>
            {Icon && <Icon size={16} />}
            {label}
          </Link>
        </li>
      ))}
    </>
  );
}

export const Navbar = async ({ session }: { session: Session | null }) => {
  return (
    <div className="navbar bg-base-100 border-b px-4 md:px-20">
      {/* LEFT: hamburger (mobile only) + logo */}
      <div className="navbar-start">
        <div className="dropdown">
          <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
            <Menu className="h-5 w-5" />
          </div>
          <ul
            tabIndex={0}
            className="menu menu-sm dropdown-content rounded-box bg-base-100 z-1 mt-3 w-52 gap-1 p-2 shadow lg:hidden"
          >
            <NavLinks session={session} />
          </ul>
        </div>
        <Link
          href="/"
          className="btn btn-ghost text-lg sm:text-xl"
          prefetch={false}
        >
          <NotebookText className="h-6 w-6 sm:h-8 sm:w-8" />
          MyCookBook
        </Link>
      </div>

      {/* CENTER: inline links (desktop only) */}
      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal gap-1 px-1">
          <NavLinks session={session} />
        </ul>
      </div>

      <div className="navbar-end gap-5">
        <ThemeSwitcher />
        <ProfileDropdown session={session} />
      </div>
    </div>
  );
};
