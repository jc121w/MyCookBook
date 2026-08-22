"use client";
import { BackButton } from "@/components/BackButton";
import { useRef } from "react";

import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Recipe as DbRecipe } from "@prisma/client";
import { RecipeCard } from "@/components/recipes/RecipeCard";
import { Recipe } from "../types";
import { RecipeCardSkeleton } from "@/components/recipes/RecipeCardSkeleton";
import { grid } from "@/lib/utils/recipe";
import Link from "next/link";
import RedirectMessage from "@/components/form/RedirectMessage";
import { SubmitHandler, useFieldArray, useForm } from "react-hook-form";
import RecipeForm from "@/components/form/RecipeForm";

const Library = () => {
  const modalRef = useRef<HTMLDialogElement>(null);

  // fetch all recips
  const {
    data: recipes,
    isLoading: isLoadingRecipes,
    error: recipesError,
  } = useQuery<DbRecipe[]>({
    queryKey: ["recipes"],
    queryFn: async () => {
      const response = await axios.get("/api");
      console.log(response.data);
      return response.data;
    },
  });

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
    <RedirectMessage error={recipesError} />;
  }
  return (
    <div className="m-auto flex max-w-4xl flex-col items-start justify-start gap-10">
      <div className="flex w-3/5 justify-between">
        <BackButton />
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

      <div className="mt-10 grid h-fit w-full items-center justify-center gap-7 md:grid-cols-2 lg:grid-cols-3">
        {recipes?.map((elem, index) => (
          <RecipeCard key={index} recipe={elem.raw as unknown as Recipe} />
        ))}
      </div>
    </div>
  );
};

export default Library;
