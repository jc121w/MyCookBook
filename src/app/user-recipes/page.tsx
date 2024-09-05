"use client";
import { BackButton } from "@/components/BackButton";
import React, { useEffect } from "react";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { RecipeSimplified } from "../types";
import { LibRecipeCard } from "@/components/LibRecipeCard";
import { RecipeForm } from "@/components/form/RecipeForm";
const Library = () => {
  // fetch all recips
  const {
    data: recipes,
    isLoading: isLoadingRecipes,
    error: recipesError,
  } = useQuery<RecipeSimplified[]>({
    queryKey: ["recipes"],
    queryFn: async () => {
      const response = await axios.get("/api");
      console.log(response.data);
      return response.data;
    },
  });

  if (isLoadingRecipes) {
    console.log(recipes);

    return (
      <div className="mt-10 text-center text-3xl font-semibold">Loading...</div>
    );
  }
  if (recipesError) return <div>Error loading recipes</div>;

  return (
    <div className="m-auto flex max-w-4xl flex-col items-start justify-start gap-10">
      <div className="flex w-3/5 justify-between">
        <BackButton />
        <button
          className="mt-5 flex h-12 w-24 select-none items-center justify-center rounded-xl border transition-all duration-200 hover:scale-[1.15] hover:bg-slate-200"
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
          <LibRecipeCard
            title={elem.title}
            src={elem.image}
            cal={String(elem.nutrients[0].amount)}
            key={index}
            id={elem.id}
            recipeDetails={elem}
          />
        ))}
      </div>
    </div>
  );
};

export default Library;
