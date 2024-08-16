"use client";
import RecipeCard from "@/components/RecipeCard";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Search } from "lucide-react";
import { useState } from "react";
import { Recipe } from "./types";
import { useRouter, useSearchParams } from "next/navigation";

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
      <div className="text-center mt-10 font-semibold text-3xl">Loading...</div>
    );
  if (recipesError) return <div>Error loading recipes</div>;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSearch((e.currentTarget as HTMLFormElement).search.value);
    router.push(
      `?search=${
        (e.currentTarget as HTMLFormElement).search.value
      }&offset=${offset}`
    );
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
