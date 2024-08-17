import axios from "axios";
import Link from "next/link";
import React, { useEffect, useState } from "react";

import { Recipe } from "@/app/types";
import { useMutation } from "@tanstack/react-query";
import Toast from "./Toast";

const ButtonAction = (props: { recipeid: number; recipe: Recipe }) => {
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
        <button className="btn btn-sm btn-secondary w-16 h-9">
          <Link href={`/recipe/${props.recipeid}`}>Info</Link>
        </button>
        <button className="btn btn-sm btn-primary w-16 h-9">
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
        <button className="btn btn-sm btn-secondary w-16 h-9">
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
  return (
    <div className="flex gap-3">
      <button className="btn btn-sm btn-secondary w-16 h-9">
        <Link href={`/recipe/${props.recipeid}`}>Info</Link>
      </button>

      <button
        className="btn btn-sm btn-primary w-16 h-9"
        onClick={addRecipeToDatabase}
      >
        Add
      </button>
    </div>
  );
};

export default ButtonAction;
