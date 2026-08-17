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
  // Recipe Form Type

  type RecipeFormValues = {
    label: string;
    yield: string;
    ingredientLines: { value: string }[];
    time: Number;
    cuisine: String;
    mealType: String;
  };
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
          className="btn"
          onClick={() => document.getElementById("recipe_modal").showModal()}
        >
          Create
        </button>
        <dialog
          id="recipe_modal"
          className="modal modal-bottom sm:modal-middle"
        >
          <div className="modal-box">
            <h3 className="text-lg font-bold">Create Recipe</h3>
            <p className="py-4">
              Press ESC key or click the button below to close
            </p>
            <div className="modal-action flex">
              <form method="dialog" className="flex-1">
                <button className="btn">Close</button>
              </form>{" "}
              <form onSubmit={() => {}} className="flex-1">
                <button className="btn">Create</button>
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
