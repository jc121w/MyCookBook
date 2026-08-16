import axios from "axios";
import React, { useState } from "react";

import { Recipe } from "@/app/types";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { AlertCircle, Bookmark, BookmarkCheck } from "lucide-react";

export const SaveButton = (props: { recipeid: String; recipe: Recipe }) => {
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

  const addRecipeToDatabase = (e: React.MouseEvent) => {
    e.stopPropagation();
    addRecipe(props.recipe);
  };

  return (
    <button
      onClick={addRecipeToDatabase}
      disabled={isPending || isSuccess}
      aria-label={isSuccess ? "Saved to library" : "Save to library"}
      className="btn btn-circle btn-sm bg-base-100/70 text-base-content hover:bg-base-100 disabled:bg-base-100/70 border-0 shadow-md backdrop-blur-sm transition-transform duration-200 hover:scale-110"
    >
      {isPending ? (
        <span className="loading loading-spinner loading-xs" />
      ) : isError ? (
        <AlertCircle className="text-error h-4 w-4" />
      ) : isSuccess ? (
        <BookmarkCheck className="text-success h-4 w-4" />
      ) : (
        <Bookmark className="h-4 w-4" />
      )}
    </button>
  );
};
