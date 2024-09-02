import axios from "axios";
import Link from "next/link";
import React, { useEffect, useState } from "react";

import { Recipe, RecipeSimplified } from "@/app/types";
import { useMutation } from "@tanstack/react-query";
import { Toast } from "./Toast";
import { useRouter } from "next/navigation";

export const ButtonActionLib = (props: {
  recipeid: number;
  recipe: RecipeSimplified;
}) => {
  const router = useRouter();
  const [success, setSuccess] = useState(false);

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

      <button className=" rounded-xl w-16 h-9 flex items-center justify-center mt-5 duration-200 select-none hover:scale-[1.15] transition-all hover:bg-green-600 bg-green-400">
        Notes
      </button>
    </div>
  );
};
