"use client";
import { Ingredient, Recipe, RecipeSimplified, Step } from "@/app/types";
import { useQuery } from "@tanstack/react-query";
import React, { FC } from "react";
import Image from "next/image";
import { BackButton } from "@/components/BackButton";

interface RecipeDetailPageProps {
  params: {
    id: string;
  };
}

const RecipeDetailPage: FC<RecipeDetailPageProps> = ({ params }) => {
  const Fraction = require("fraction.js");
  const recipeID = params.id;
  const getRecipeFromLocal = () => {
    const recipeString = localStorage.getItem("currRecipe");

    if (recipeString) {
      let recipe = JSON.parse(recipeString);

      if ("nutrition" in recipe) {
        // then it's not simplified
        recipe = {
          id: recipe.id,
          title: recipe.title,
          image: recipe.image,
          cheap: recipe.cheap,
          readyInMinutes: recipe.readyInMinutes,
          servings: recipe.servings,
          summary: recipe.summary,
          nutrients: recipe.nutrition.nutrients,
          ingredients: recipe.nutrition.ingredients,
          steps:
            recipe.analyzedInstructions[0]?.steps.map((step: Step) => ({
              number: step.number,
              stepIngredients: step.ingredients.map(
                (ingredient) => ingredient.name
              ),
              step: step.step,
            })) || [],
        };
      }
      console.log(recipe);
      return recipe;
    }
    return null;
  };

  const {
    data: fetchedRecipe,
    isLoading: isLoadingRecipes,
    error: recipesError,
  } = useQuery<RecipeSimplified | null>({
    queryKey: ["recipes", recipeID],
    queryFn: () => getRecipeFromLocal(),
  });

  if (isLoadingRecipes)
    return (
      <div className="text-center mt-10 font-semibold text-3xl">Loading...</div>
    );
  if (recipesError)
    return (
      <div className="text-center mt-10 font-semibold text-3xl text-red-600">
        Error loading recipe
      </div>
    );
  return (
    <div className="max-w-screen-xl px-2.5 md:px-20 mx-auto h-full 2xl:max-w-screen-2xl ">
      <BackButton />
      {fetchedRecipe ? (
        <>
          <div className="flex xl:flex-row flex-col gap-8 items-start">
            <div>
              <h3 className="font-bold text-2xl py-5 text-pretty">
                {fetchedRecipe.title}
              </h3>
              <Image
                src={fetchedRecipe.image}
                alt=""
                width={500}
                height={0}
                className="w-fit rounded-lg hover:scale-110 transition-transform duration-200"
              />
            </div>
            <div className="flex flex-col py-6 gap-3">
              <div className="flex gap-5 ">
                {" "}
                <span className="italic">
                  {" "}
                  Serves: {fetchedRecipe.servings}
                </span>
                <span className="italic">
                  {" "}
                  Time: {fetchedRecipe.readyInMinutes} min
                </span>
                <span className="italic">
                  {" "}
                  Calories: {Math.round(fetchedRecipe.nutrients[0].amount)}kcal
                </span>{" "}
                <span className="italic">
                  {" "}
                  Protein: {Math.round(fetchedRecipe.nutrients[10].amount)}g
                </span>
                <span className="italic">
                  {" "}
                  Sugar: {Math.round(fetchedRecipe.nutrients[5].amount)}g
                </span>
                <span className="italic">
                  {" "}
                  Fat: {Math.round(fetchedRecipe.nutrients[1].amount)}g
                </span>
              </div>
              <p className="prose max-w-xl border  p-3 rounded-lg bg-orange-200 bg-opacity-70 ">
                {" "}
                {fetchedRecipe.summary
                  .replace(/<\/?[^>]+(>|$)/g, "")
                  .replace(/If you like this recipe.*/, "")}
              </p>
            </div>
          </div>

          <h3 className="text-2xl font-semibold py-5">Ingredients</h3>
          <div className="flex gap-3 flex-wrap">
            {fetchedRecipe.ingredients.map((elem, index) => {
              const frac = new Fraction(elem.amount).toFraction(true);
              return (
                <div
                  key={index}
                  className="border rounded-lg p-2 bg-sky-400 font-medium"
                >
                  {frac} {elem.unit} {elem.name}
                </div>
              );
            })}
          </div>
          <div className=" flex flex-col gap-5 my-10">
            {fetchedRecipe.steps.map((elem, index) => {
              return (
                <div
                  className="border p-3 rounded-lg bg-orange-200 bg-opacity-70 flex flex-col gap-2"
                  key={index}
                >
                  <h4 className="font-semibold text-xl"> Step {elem.number}</h4>
                  <div>
                    {" "}
                    <span className="font-medium text-lg">
                      Ingredients Needed:{" "}
                    </span>
                    <span className="text-lime-600">
                      {elem.stepIngredients.join(", ")}
                    </span>
                  </div>
                  <p className="prose prose-zinc prose-lg">{elem.step}</p>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <p> Loading Recipe</p>
      )}
    </div>
  );
};

export default RecipeDetailPage;
