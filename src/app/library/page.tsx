"use client";
import { BackButton } from "@/components/BackButton";
import React, { useEffect } from "react";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { RecipeForm } from "@/components/form/RecipeForm";
import { Recipe as DbRecipe } from "@prisma/client";
import { RecipeCard } from "@/components/recipes/RecipeCard";
import { Recipe } from "../types";
import { RecipeCardSkeleton } from "@/components/recipes/RecipeCardSkeleton";
import { grid } from "@/lib/utils/recipe";
import Link from "next/link";
import RedirectMessage from "@/components/form/RedirectMessage";

const Library = () => {
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
        <button
          className="mt-5 flex h-12 w-24 items-center justify-center rounded-xl border transition-all duration-200 select-none hover:scale-[1.15] hover:bg-slate-200"
          onClick={() => {
            const dialog = document.getElementById(
              "my_modal_1",
            ) as HTMLDialogElement;
            dialog.showModal();
          }}
        >
          Create
        </button>

        <dialog id="my_modal_1" className="modal">
          <div className="modal-box">
            <h3 className="text-lg font-bold">Add Recipe</h3>
            <RecipeForm />
            <div className="modal-action">
              <form method="dialog">
                <button className="btn">Close</button>
              </form>
            </div>
          </div>
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
