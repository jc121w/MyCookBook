"use client";
import { signIn, signOut } from "next-auth/react";
export const SignOutButton = () => {
  return (
    <button className="btn btn-ghost" onClick={() => signOut()}>
      <span className="font-semibold">Sign Out</span>
    </button>
  );
};
