"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

// "‹ Back": returns to where you came from (e.g. your search results, scroll and all).
// Opened from a shared link or a new tab, there's nowhere to go back to, so it goes to
// `fallback` instead of doing nothing.
export const BackButton = ({
  fallback = "/search",
  label = "Back",
}: {
  fallback?: string;
  label?: string;
}) => {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => {
        // Came from a page in this app? Then history has somewhere to go
        const fromHere =
          document.referrer &&
          new URL(document.referrer).origin === window.location.origin;
        if (fromHere || window.history.length > 1) router.back();
        else router.push(fallback);
      }}
      className="group hover:bg-base-200 -ml-3 inline-flex h-9 items-center gap-1 rounded-full pr-4 pl-2.5 font-serif text-sm opacity-75 transition hover:opacity-100"
    >
      <ChevronLeft
        className="h-4 w-4 transition-transform group-hover:-translate-x-0.5"
        aria-hidden
      />
      {label}
    </button>
  );
};
