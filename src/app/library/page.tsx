"use client";
import { Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import type { BookWithCount } from "../types";
import RedirectMessage from "@/components/form/RedirectMessage";
import RecipeForm from "@/components/form/RecipeForm";
import { libraryQuery } from "@/lib/library";
import { BookShelf } from "@/components/journal/BookShelf";

// useSearchParams needs a Suspense boundary in the App Router
export default function LibraryPage() {
  return (
    <Suspense>
      <Library />
    </Suspense>
  );
}

const Library = () => {
  // /library?book=12 opens book 12 (links from search and the profile use this)
  const router = useRouter();
  const bookParam = Number(useSearchParams().get("book"));
  const openBookId =
    Number.isInteger(bookParam) && bookParam > 0 ? bookParam : null;

  // fetch all recips
  const {
    data: recipes,
    isLoading: isLoadingRecipes,
    error: recipesError,
    refetch,
  } = useQuery(libraryQuery); // shared with search (src/lib/library.ts)
  const modalRef = useRef<HTMLDialogElement>(null);
  if (isLoadingRecipes) {
    return (
      // Bookcase-shaped placeholder while the shelf loads
      <div className="w-full">
        <div className="skeleton mb-3 h-8 w-full max-w-xs" />
        <div className="skeleton h-[520px] w-full rounded-md" />
      </div>
    );
  }
  if (recipesError) {
    return <RedirectMessage error={recipesError} onRetry={() => refetch()} />;
  }

  return (
    <div className="w-full">
      {/* Opened by the "New book" slot on the shelf */}
      <dialog ref={modalRef} className="modal modal-bottom sm:modal-middle">
        <RecipeForm onDone={() => modalRef.current?.close()} />
        {/* Click-outside-to-close: must be a direct child of .modal */}
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
      <BookShelf
        books={recipes ?? []}
        onAddBook={() => modalRef.current?.showModal()}
        openBookId={openBookId}
        // Closing a linked book drops ?book= so a refresh doesn't reopen it
        onBookClosed={() =>
          openBookId && router.replace("/library", { scroll: false })
        }
      />
    </div>
  );
};
