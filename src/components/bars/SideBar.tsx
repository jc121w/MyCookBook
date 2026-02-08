// components/bars/SideBar.tsx
import { SidebarProps } from "@/constants/navigation";
import { ChevronsLeft, ChevronsRight, LogIn, LucideIcon } from "lucide-react";
import Link from "next/link";
import ProfileCard from "../profile/ProfileCard";
import { SignOutButton } from "../buttons/SignOutButton";

export default function SideBar({ session, drawerId, links }: SidebarProps) {
  return (
    <div className="is-drawer-close:overflow-visible drawer-side bg-base-300">
      <label
        htmlFor={drawerId}
        aria-label="close sidebar"
        className="drawer-overlay"
      ></label>
      <div className="is-drawer-close:w-14 is-drawer-open:w-64 flex min-h-full flex-col items-center bg-base-200 p-2">
        <ul className="menu min-h-full grow gap-3">
          <li>
            <div className="flex items-start">
              {session && (
                <ProfileCard
                  name={session.user.name}
                  email={session.user.email}
                  img={session.user.image ?? undefined}
                />
              )}{" "}
              <label
                htmlFor="profile-drawer"
                className="btn btn-square btn-ghost"
              >
                <ChevronsLeft className="is-drawer-open:block hidden" />
                <ChevronsRight className="is-drawer-open:hidden block" />
              </label>
            </div>
          </li>

          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="is-drawer-close:tooltip is-drawer-close:tooltip-right"
              >
                {link.icon && <link.icon size={20} />}
                <span className="is-drawer-close:hidden">{link.label}</span>
              </Link>
            </li>
          ))}

          {session && (
            <li className="flex items-center">
              <SignOutButton />
            </li>
          )}
          {!session && (
            <li>
              <Link
                href="/sign-in"
                className="is-drawer-close:tooltip is-drawer-close:tooltip-right flex items-center gap-2"
              >
                <LogIn />
                <span className="is-drawer-close:hidden">Sign In</span>
              </Link>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
