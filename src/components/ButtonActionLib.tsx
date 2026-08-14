import axios from "axios";
import Link from "next/link";
import React, { useEffect, useState } from "react";

import { Recipe } from "@/app/types";
import { useMutation } from "@tanstack/react-query";
import { Toast } from "./Toast";
import { useRouter } from "next/navigation";

export const ButtonActionLib = (props: {
  recipeid: number;
  recipe: Recipe;
}) => {
  const router = useRouter();
  const [success, setSuccess] = useState(false);

  const saveToLocal = () => {
    localStorage.setItem("currRecipe", JSON.stringify(props.recipe));
    router.push(`api/saved/${props.recipeid}`);
  };
  return (
    <div className="flex gap-3">
      <button
        className="mt-5 flex h-9 w-16 select-none items-center justify-center rounded-xl bg-orange-300 transition-all duration-200 hover:scale-[1.15] hover:bg-orange-600"
        onClick={saveToLocal}
      >
        Info
      </button>

      <button className="mt-5 flex h-9 w-16 select-none items-center justify-center rounded-xl bg-green-400 transition-all duration-200 hover:scale-[1.15] hover:bg-green-600">
        Notes
      </button>
    </div>
  );
};
