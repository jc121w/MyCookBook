"use client";
import { BackButton } from "@/components/BackButton";
import { useRef } from "react";

import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";
import { RecipeForm } from "@/components/form/RecipeForm";
import { Recipe as DbRecipe } from "@prisma/client";
import { RecipeCard } from "@/components/recipes/RecipeCard";
import { Recipe } from "../types";
import { RecipeCardSkeleton } from "@/components/recipes/RecipeCardSkeleton";
import { grid } from "@/lib/utils/recipe";
import Link from "next/link";
import RedirectMessage from "@/components/form/RedirectMessage";
import { SubmitHandler, useForm } from "react-hook-form";

const Library = () => {
  const modalRef = useRef<HTMLDialogElement>(null);
  // Recipe Form Type
  type RecipeFormValues = {
    label: string;
    yield: string;
    ingredientLines: { value: string }[];
    time: Number;
    cuisine: String;
    mealType: String;
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RecipeFormValues>();

  const submit: SubmitHandler<RecipeFormValues> = async (data) => {
    addRecipe(data);
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

  // Create a recipe

  const {
    mutate: addRecipe,
    isPending,
    isError,
    error,
  } = useMutation({
    mutationFn: (newUserData: RecipeFormValues) => {
      return axios.post("/api", newUserData);
    },
    onError: (error) => {
      console.error("Error adding User:", error);
    },
    onSuccess: () => {
      console.log("User added successfully");
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
          <form action="" onSubmit={handleSubmit(submit)}>
            <div className="modal-box">
              <h3 className="text-lg font-bold">Create Recipe</h3>
              <div className="flex flex-col">
                {" "}
                <input type="text" placeholder="Duration" className="input" />
              </div>

              <div className="modal-action flex">
                <form method="dialog" className="flex-1">
                  <button className="btn">Close</button>
                </form>{" "}
                <form onSubmit={() => {}} className="flex-1">
                  <button className="btn">Create</button>
                </form>
              </div>
            </div>
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
