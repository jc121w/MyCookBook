// components/bars/SideBar.tsx
import { SidebarProps } from "@/constants/navigation";
import { ChevronsLeft, ChevronsRight, LogIn, LucideIcon } from "lucide-react";
import Link from "next/link";
import ProfileCard from "../profile/ProfileCard";
import { SignOutButton } from "../buttons/SignOutButton";

export default function SideBar({ session, drawerId, links }: SidebarProps) {
  return (
    <div className="drawer-side bg-base-300 is-drawer-close:overflow-visible">
      <label
        htmlFor={drawerId}
        aria-label="close sidebar"
        className="drawer-overlay"
      ></label>
      <div className="flex min-h-full flex-col bg-base-200 p-2 is-drawer-close:w-14 is-drawer-open:w-64">
        <ul className="menu min-h-full grow gap-3">
          <div className="flex items-start">
            <li>
              {" "}
              {session && (
                <ProfileCard
                  name={session.user.name}
                  email={session.user.email}
                  img={session.user.image ?? undefined}
                />
              )}{" "}
            </li>
            <li>
              <label
                htmlFor="profile-drawer"
                className="flex cursor-pointer justify-end"
              >
                <ChevronsLeft className="hidden is-drawer-open:block" />
                <ChevronsRight className="block is-drawer-open:hidden" />
              </label>
            </li>
          </div>

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
            <li>
              <SignOutButton />
            </li>
          )}
          {!session && (
            <li>
              <Link
                href="/sign-in"
                className="is-drawer-close:tooltip is-drawer-close:tooltip-right"
              >
                <LogIn size={20} />
                <span className="is-drawer-close:hidden">Sign In</span>
              </Link>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
