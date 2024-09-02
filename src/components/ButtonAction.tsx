import axios from "axios";
import Link from "next/link";
import React, { useEffect, useState } from "react";

import { Recipe } from "@/app/types";
import { useMutation } from "@tanstack/react-query";
import { Toast } from "./Toast";
import { useRouter } from "next/navigation";

export const ButtonAction = (props: { recipeid: number; recipe: Recipe }) => {
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
      <div className="flex gap-3 justify-between items-end">
        <button className=" rounded-xl w-16 h-9 flex items-center justify-center mt-5 duration-200 select-none hover:scale-[1.15] transition-all hover:bg-orange-600 bg-orange-300">
          <Link href={`/recipe/${props.recipeid}`}>Info</Link>
        </button>
        <button className="rounded-xl w-16 h-9 flex items-center justify-center mt-5 duration-200 select-none hover:scale-[1.15] transition-all hover:bg-green-600 bg-green-400">
          <span className="loading loading-spinner"></span>
        </button>
      </div>
    );

  if (isError)
    return (
      <div className="flex gap-3 justify-between items-end">
        <button className="btn btn-sm btn-secondary w-16 h-9">
          <Link href={`/recipe/${props.recipeid}`}>Info</Link>
        </button>
        <span className="font-semibold text-lg">Error</span>
      </div>
    );
  if (isSuccess)
    return (
      <div className="flex gap-3 justify-between items-end">
        <button className="rounded-xl w-16 h-9 flex items-center justify-center mt-5 duration-200 select-none hover:scale-[1.15] transition-all hover:bg-orange-600 bg-orange-300">
          <Link href={`/recipe/${props.recipeid}`}>Info</Link>
        </button>
        <Toast
          message="Successfully added to your library."
          title={props.recipe.title}
          visible={success}
          close={flip}
        />
      </div>
    );
  const addRecipeToDatabase = () => {
    addRecipe(props.recipe);
  };

  const saveToLocal = () => {
    localStorage.setItem("currRecipe", JSON.stringify(props.recipe));
    router.push(`/recipe/${props.recipeid}`);
  };
  return (
    <div className="flex gap-3">
      <button
        className=" rounded-xl w-16 h-9 flex items-center justify-center mt-5 duration-200 select-none hover:scale-[1.15] transition-all hover:bg-orange-600 bg-orange-300"
        onClick={saveToLocal}
      >
        Info
      </button>

      <button
        className=" rounded-xl w-16 h-9 flex items-center justify-center mt-5 duration-200 select-none hover:scale-[1.15] transition-all hover:bg-green-600 bg-green-400"
        onClick={addRecipeToDatabase}
      >
        Add
      </button>
    </div>
  );
};
