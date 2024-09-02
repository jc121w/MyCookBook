"use client";
import { BackButton } from "@/components/BackButton";
import React, { useEffect } from "react";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { RecipeSimplified } from "../types";
import { LibRecipeCard } from "@/components/LibRecipeCard";
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
      <div className="text-center mt-10 font-semibold text-3xl">Loading...</div>
    );
  }
  if (recipesError) return <div>Error loading recipes</div>;

  return (
    <div className="max-w-4xl flex flex-col items-center m-auto justify-start gap-10">
      <BackButton />
      This is the user recipe library
      <div className="w-full h-fit grid items-center justify-center md:grid-cols-2 lg:grid-cols-3 gap-7 mt-10">
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
