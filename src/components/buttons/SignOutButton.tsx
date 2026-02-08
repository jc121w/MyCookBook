"use client";

import { signOut } from "@/lib/actions/auth-actions";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
export const SignOutButton = () => {
  const router = useRouter();
  const handleSignOut = async () => {
    await signOut();
    router.push("/sign-in");
  };
  return (
    <button
      className="is-drawer-close:tooltip is-drawer-close:tooltip-right btn btn-ghost"
      onClick={handleSignOut}
    >
      <LogOut />
      <span className="is-drawer-close:hidden">Sign Out</span>
    </button>
  );
};
