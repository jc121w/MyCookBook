"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { BookCheck, BookPlus, LogIn } from "lucide-react";
import Link from "next/link";
import type { Recipe } from "@/app/types";
import { useToast } from "@/components/Toaster";
import { libraryQuery } from "@/lib/library";

// A clear, labeled button under each search result:
//   [+ Add to shelf]  →  [Adding…]  →  [✓ On your shelf]  (links to /library)
// Signed out → [Sign in to save]. It knows what's already on your shelf.
export function AddToShelfButton({
  recipe,
  edamamId,
}: {
  recipe: Recipe;
  edamamId: string;
}) {
  const queryClient = useQueryClient();
  const shelf = useQuery(libraryQuery); // cached; shared by every card on the page
  // The shelf copy of this recipe, if you've added it (its id opens the book)
  const book = shelf.data?.find((b) => b.edamamId === edamamId);
  const onShelf = book != null;
  const signedOut =
    axios.isAxiosError(shelf.error) && shelf.error.response?.status === 401;

  const toast = useToast();
  const add = useMutation({
    mutationFn: () =>
      axios.post<{ id: number }>("/api/library", recipe).then((r) => r.data),
    onSuccess: (saved) => {
      // Refetch the shelf: this card flips to "On your shelf", and the library page is current
      void queryClient.invalidateQueries({ queryKey: libraryQuery.queryKey });
      // …and offer to go straight to the new book
      toast({
        message: (
          <>
            <span className="font-semibold">{recipe.label}</span> is on your
            shelf
          </>
        ),
        action: { label: "Open book", href: `/library?book=${saved.id}` },
      });
    },
  });

  const base = "btn btn-sm w-full gap-1.5 font-serif";

  if (signedOut) {
    return (
      <Link href="/sign-in" className={`${base} btn-ghost`}>
        <LogIn className="h-4 w-4" /> Sign in to save
      </Link>
    );
  }

  if (onShelf) {
    return (
      <Link
        href={`/library?book=${book!.id}`}
        className={`${base} btn-ghost text-success`}
        title="Open this book on your shelf"
      >
        <BookCheck className="h-4 w-4" /> On your shelf
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={`${base} ${add.isError ? "btn-error btn-outline" : "btn-primary btn-outline"}`}
      onClick={() => add.mutate()}
      disabled={add.isPending || shelf.isLoading}
    >
      {add.isPending ? (
        <>
          <span className="loading loading-spinner loading-xs" /> Adding…
        </>
      ) : add.isError ? (
        "Couldn't add. Try again"
      ) : (
        <>
          <BookPlus className="h-4 w-4" /> Add to shelf
        </>
      )}
    </button>
  );
}
