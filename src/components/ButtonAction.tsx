import axios from "axios";
import Link from "next/link";
import React, { useEffect, useState } from "react";

import { Recipe } from "@/app/types";
import { useMutation } from "@tanstack/react-query";
import { Toast } from "./Toast";
import { useRouter } from "next/navigation";

export const ButtonAction = (props: { recipeid: String; recipe: Recipe }) => {
  const router = useRouter();
  const [success, setSuccess] = useState(false);
  const flip = () => {
    setSuccess(!success);
  };
  const {
    mutate: addRecipe,
    isPending,
    isError,
    isSuccess,
  } = useMutation({
    mutationFn: (newRecipe: Recipe) => {
      return axios.post("/api", newRecipe);
    },
    onError: (error) => {
      console.error("Error adding recipe:", error);
    },
    onSuccess: () => {
      console.log("Recipe added successfully");
    },
  });

  if (isPending)
    return (
      <div className="flex items-end justify-between gap-3">
        <button className="mt-5 flex h-9 w-16 select-none items-center justify-center rounded-xl bg-orange-300 transition-all duration-200 hover:scale-[1.15] hover:bg-orange-600">
          <Link href={`/recipe/${props.recipeid}`}>Info</Link>
        </button>
        <button className="mt-5 flex h-9 w-16 select-none items-center justify-center rounded-xl bg-green-400 transition-all duration-200 hover:scale-[1.15] hover:bg-green-600">
          <span className="loading loading-spinner"></span>
        </button>
      </div>
    );

  if (isError)
    return (
      <div className="flex items-end justify-between gap-3">
        <button className="btn btn-secondary btn-sm h-9 w-16">
          <Link href={`/recipe/${props.recipeid}`}>Info</Link>
        </button>
        <span className="text-lg font-semibold">Error</span>
      </div>
    );
  if (isSuccess)
    return (
      <div className="flex items-end justify-between gap-3">
        <button className="mt-5 flex h-9 w-16 select-none items-center justify-center rounded-xl bg-orange-300 transition-all duration-200 hover:scale-[1.15] hover:bg-orange-600">
          <Link href={`/recipe/${props.recipeid}`}>Info</Link>
        </button>
        <Toast
          message="Successfully added to your library."
          title={props.recipe.label}
          visible={success}
          close={flip}
        />
      </div>
    );
  const addRecipeToDatabase = (e: React.MouseEvent) => {
    e.stopPropagation();
    addRecipe(props.recipe);
  };

  return (
    <button
      className="mt-5 flex h-9 w-16 select-none items-center justify-center rounded-xl bg-green-400 transition-all duration-200 hover:scale-[1.15] hover:bg-green-600"
      onClick={addRecipeToDatabase}
    >
      Save
    </button>
  );
};
