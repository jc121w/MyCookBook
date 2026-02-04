"use client";

import { signOut } from "@/lib/actions/auth-actions";
import { useRouter } from "next/navigation";

export const SignOutButton = () => {
  const router = useRouter();
  const handleSignOut = async () => {
    await signOut();
    router.push("/sign-in");
  };
  return (
    <button className="btn btn-ghost" onClick={handleSignOut}>
      <span className="font-semibold">Sign Out</span>
    </button>
  );
};
