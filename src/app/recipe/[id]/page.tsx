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
                (ingredient) => ingredient.name,
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
      <div className="mt-10 text-center text-3xl font-semibold">Loading...</div>
    );
  if (recipesError)
    return (
      <div className="mt-10 text-center text-3xl font-semibold text-red-600">
        Error loading recipe
      </div>
    );
  return (
    <div>
      <BackButton />
      {fetchedRecipe ? (
        <>
          <div className="flex flex-col items-start gap-8 xl:flex-row">
            <div>
              <h3 className="text-pretty py-5 text-2xl font-bold">
                {fetchedRecipe.title}
              </h3>
              <Image
                src={fetchedRecipe.image}
                alt=""
                width={500}
                height={0}
                className="w-fit rounded-lg transition-transform duration-200 hover:scale-110"
              />
            </div>
            <div className="flex flex-col gap-3 py-6">
              <div className="flex flex-wrap gap-5">
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
              <p className="prose max-w-xl rounded-lg border bg-orange-200 bg-opacity-70 p-3">
                {" "}
                {fetchedRecipe.summary
                  .replace(/<\/?[^>]+(>|$)/g, "")
                  .replace(/If you like this recipe.*/, "")}
              </p>
            </div>
          </div>

          <h3 className="py-5 text-2xl font-semibold">Ingredients</h3>
          <div className="flex flex-wrap gap-3">
            {fetchedRecipe.ingredients.map((elem, index) => {
              const frac = new Fraction(elem.amount).toFraction(true);
              return (
                <div
                  key={index}
                  className="rounded-lg border bg-sky-400 p-2 font-medium"
                >
                  {frac} {elem.unit} {elem.name}
                </div>
              );
            })}
          </div>
          <div className="my-10 flex flex-col gap-5">
            {fetchedRecipe.steps.map((elem, index) => {
              return (
                <div
                  className="flex flex-col gap-2 rounded-lg border bg-orange-200 bg-opacity-70 p-3"
                  key={index}
                >
                  <h4 className="text-xl font-semibold"> Step {elem.number}</h4>
                  <div>
                    {" "}
                    <span className="text-lg font-medium">
                      Ingredients Needed:{" "}
                    </span>
                    <span className="text-lime-600">
                      {elem.stepIngredients.join(", ")}
                    </span>
                  </div>
                  <p className="prose prose-lg prose-zinc">{elem.step}</p>
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
