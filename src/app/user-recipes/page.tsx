"use client";
import BackButton from "@/components/BackButton";
import React, { useEffect } from "react";
import { db } from "@/lib/db";
import RecipeCard from "@/components/RecipeCard";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Recipes } from "@prisma/client";
const Library = () => {
  // fetch all recips
  const {
    data: recipes,
    isLoading: isLoadingRecipes,
    error: recipesError,
  } = useQuery<Recipes[]>({
    queryKey: ["recipes"],
    queryFn: async () => {
      const response = await axios.get("/api/recipes");
      return response.data;
    },
  });

  if (isLoadingRecipes)
    return (
      <div className="text-center mt-10 font-semibold text-3xl">Loading...</div>
    );
  if (recipesError) return <div>Error loading recipes</div>;

  return (
    <div>
      <BackButton />
      This is the user recipe library
      {recipes?.map((elem, index) => (
        <RecipeCard
          title={elem.name}
          src={elem.src}
          cal={String(elem.calories)}
          key={index}
          id={elem.id}
        />
      ))}
    </div>
  );
};

export default Library;
