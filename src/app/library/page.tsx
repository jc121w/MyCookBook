"use client";
import { useRef } from "react";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { RecipeCard } from "@/components/recipes/RecipeCard";
import type { BookWithCount } from "../types";
import { RecipeCardSkeleton } from "@/components/recipes/RecipeCardSkeleton";
import { grid } from "@/lib/utils/recipe";
import RedirectMessage from "@/components/form/RedirectMessage";
import RecipeForm from "@/components/form/RecipeForm";
import { BookShelf } from "@/components/journal/BookShelf";

const Library = () => {
  // fetch all recips
  const {
    data: recipes,
    isLoading: isLoadingRecipes,
    error: recipesError,
  } = useQuery<BookWithCount[]>({
    queryKey: ["recipes"],
    queryFn: async () => {
      const response = await axios.get("/api/library");
      return response.data;
    },
  });
  const modalRef = useRef<HTMLDialogElement>(null);
  if (isLoadingRecipes) {
    return (
      <div className={grid}>
        {Array.from({ length: 8 }).map((_, i) => (
          <RecipeCardSkeleton key={i} />
        ))}
      </div>
    );
  }
  if (recipesError) {
    return <RedirectMessage error={recipesError} />;
  }

  return (
    <div className="m-auto flex max-w-4xl flex-col items-start justify-start gap-10">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <button className="btn" onClick={() => modalRef.current?.showModal()}>
          Create
        </button>
        <dialog ref={modalRef} className="modal modal-bottom sm:modal-middle">
          <RecipeForm />
          {/* Click-outside-to-close: must be a direct child of .modal */}
          <form method="dialog" className="modal-backdrop">
            <button>close</button>
          </form>
        </dialog>
      </div>
      <BookShelf books={recipes ?? []} />
    </div>
  );
};

export default Library;
