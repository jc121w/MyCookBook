import Link from "next/link";
import { CircleUser } from "lucide-react";
import { auth } from "@/lib/auth";
import { SignOutButton } from "../buttons/SignOutButton";
import { sideBarLinks } from "@/constants/navigation";

type Session = typeof auth.$Infer.Session;

export default function ProfileDropdown({
  session,
}: {
  session: Session | null;
}) {
  // Logged out → just a sign-in button
  if (!session) {
    return (
      <Link href="/sign-in" className="btn btn-primary btn-sm">
        Sign In
      </Link>
    );
  }

  const { name, image } = session.user;

  return (
    <div className="dropdown dropdown-end">
      <div
        tabIndex={0}
        role="button"
        className="btn btn-ghost btn-circle avatar"
      >
        <div className="w-10 items-center rounded-full">
          {image ? (
            <img alt={name} src={image} />
          ) : (
            <CircleUser className="flex h-full w-full items-center" />
          )}
        </div>
      </div>
      <ul
        tabIndex={0}
        className="menu menu-sm dropdown-content rounded-box bg-base-100 z-[1] mt-3 w-52 p-2 shadow"
      >
        <li className="menu-title truncate">{name}</li>
        <li>
          <Link href="/profile">Profile</Link>
        </li>
        <li>
          <SignOutButton />
        </li>
      </ul>
    </div>
  );
}
