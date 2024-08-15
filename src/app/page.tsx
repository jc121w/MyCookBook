"use client";
import RecipeCard from "@/components/RecipeCard";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Search, UtensilsCrossed } from "lucide-react";
import { Span } from "next/dist/trace";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Recipe } from "./types";
export default function Home() {
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);

  const API_KEY = "484e807b68fe4c63a1f69e17fc23764c";

  const fetchRecipes = async (search: string, offset: number) => {
    const url = `https://api.spoonacular.com/recipes/complexSearch?apiKey=${API_KEY}&query=${search}&number=8&offset=${offset}&addRecipeNutrition=true&addRecipeInstructions=true`;
    const response = await axios.get(url);
    return response.data.results;
  };

  const {
    data: fetchedRecipes,
    isLoading: isLoadingRecipes,
    error: recipesError,
  } = useQuery<Recipe[]>({
    queryKey: ["recipes", search, offset],
    queryFn: () => fetchRecipes(search, offset),
    enabled: !!search,
  });

  if (isLoadingRecipes)
    return (
      <div className="text-center mt-10 font-semibold text-3xl">Loading...</div>
    );
  if (recipesError) return <div>Error loading recipes</div>;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSearch((e.currentTarget as HTMLFormElement).search.value);
  };
  return (
    <main className=" max-w-4xl flex flex-col items-center m-auto h-screen justify-start gap-10">
      <form
        onSubmit={handleSubmit}
        className="border rounded-lg w-80 h-12 flex justify-between items-center mt-8 relative"
      >
        <input
          type="text"
          name="search"
          className="h-full w-full rounded-lg block p-5"
          placeholder="Find a recipe"
        ></input>{" "}
        <button type="submit" className="absolute right-5">
          {" "}
          <Search />
        </button>
      </form>
      <div className="w-full h-fit grid items-center justify-center md:grid-cols-2 lg:grid-cols-3 gap-7 mt-10">
        {" "}
        {fetchedRecipes?.length == 0 ? (
          <span className="font-semibold prose text-2xl"> No results</span>
        ) : (
          fetchedRecipes?.map((elem, index: number) => {
            console.log(elem);
            return (
              <RecipeCard
                title={elem.title}
                src={elem.image}
                cal={String(elem.nutrition?.nutrients[0].amount)}
                key={index}
                id={elem.id}
                recipe={elem}
              />
            );
          })
        )}
      </div>
    </main>
  );
}
