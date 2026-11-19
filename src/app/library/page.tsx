"use client";
import { useRef } from "react";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import type { BookWithCount } from "../types";
import RedirectMessage from "@/components/form/RedirectMessage";
import RecipeForm from "@/components/form/RecipeForm";
import { libraryQuery } from "@/lib/library";
import { BookShelf } from "@/components/journal/BookShelf";

const Library = () => {
  // fetch all recips
  const {
    data: recipes,
    isLoading: isLoadingRecipes,
    error: recipesError,
  } = useQuery(libraryQuery); // shared with search (src/lib/library.ts)
  const modalRef = useRef<HTMLDialogElement>(null);
  if (isLoadingRecipes) {
    return (
      // Bookcase-shaped placeholder while the shelf loads
      <div className="mx-auto w-full max-w-5xl px-4 py-10">
        <div className="skeleton mb-3 h-8 w-full max-w-xs" />
        <div className="skeleton h-[520px] w-full rounded-md" />
      </div>
    );
  }
  if (recipesError) {
    return <RedirectMessage error={recipesError} />;
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
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
      />
    </div>
  );
};

export default Library;
