"use client";
import { RecipeCard } from "@/components/RecipeCard";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Search } from "lucide-react";
import { useState } from "react";

import { useRouter, useSearchParams } from "next/navigation";
import { Recipe } from "../types";

export default function Home({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const router = useRouter();
  console.log(searchParams);
  const query = searchParams.search;
  const offSet = searchParams.offset;
  const [search, setSearch] = useState(query || "");
  const [offset, setOffset] = useState(0);

  const API_KEY = "6071011076f24918823d6fa3c45447a2";

  const fetchRecipes = async () => {
    const url = `https://api.spoonacular.com/recipes/complexSearch?apiKey=${API_KEY}&query=${query}&number=8&offset=${offSet}&addRecipeNutrition=true&addRecipeInstructions=true`;
    const response = await axios.get(url);

    return response.data.results;
  };

  const {
    data: fetchedRecipes,
    isLoading: isLoadingRecipes,
    error: recipesError,
  } = useQuery<Recipe[]>({
    queryKey: ["recipes", search, offset],
    queryFn: () => fetchRecipes(),
    enabled: !!search,
  });

  if (isLoadingRecipes)
    return (
      <div className="mt-10 text-center text-3xl font-semibold">Loading...</div>
    );
  if (recipesError)
    return (
      <div className="prose mt-10 text-center text-3xl font-semibold text-red-600">
        Error loading recipes
      </div>
    );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSearch((e.currentTarget as HTMLFormElement).search.value);
    router.push(
      `?search=${
        (e.currentTarget as HTMLFormElement).search.value
      }&offset=${offset}`,
    );
  };

  return (
    <main className="m-auto flex h-screen max-w-4xl flex-col items-center justify-start gap-10">
      <form
        onSubmit={handleSubmit}
        className="relative mt-8 flex h-12 w-80 items-center justify-between rounded-lg border"
      >
        <input
          type="text"
          name="search"
          className="block h-full w-full rounded-lg p-5"
          placeholder="Find a recipe"
        ></input>{" "}
        <button type="submit" className="absolute right-5">
          {" "}
          <Search />
        </button>
      </form>
      <div className="mt-10 grid h-fit w-full items-center justify-center gap-7 md:grid-cols-2 lg:grid-cols-3">
        {" "}
        {fetchedRecipes?.length == 0 ? (
          <span className="prose text-2xl font-semibold"> No results</span>
        ) : (
          fetchedRecipes?.map((elem, index: number) => {
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
