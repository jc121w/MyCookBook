// components/bars/SideBar.tsx
import { SidebarProps } from "@/constants/navigation";
import { LogIn, LucideIcon } from "lucide-react";
import Link from "next/link";
import ProfileCard from "../ProfileCard";
import { SignOutButton } from "../buttons/SignOutButton";

export default function SideBar({ session, drawerId, links }: SidebarProps) {
  return (
    <div className="drawer-side">
      <label
        htmlFor={drawerId}
        aria-label="close sidebar"
        className="drawer-overlay"
      ></label>
      <ul className="menu min-h-full w-80 space-y-5 bg-base-200 p-4">
        {session && (
          <ProfileCard
            name={session.user.name}
            email={session.user.email}
            img={session.user.image ?? undefined}
          />
        )}
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href}>
              {link.icon && <link.icon size={20} />}
              {link.label}
            </Link>
          </li>
        ))}
        {session && (
          <div className="flex items-center">
            <SignOutButton />
          </div>
        )}
        {!session && (
          <div>
            <button className="btn btn-ghost">
              <Link href="/sign-in" className="flex items-center gap-2">
                <LogIn />
                <span className="font-semibold">Sign In</span>
              </Link>
            </button>
          </div>
        )}
      </ul>
    </div>
  );
}
