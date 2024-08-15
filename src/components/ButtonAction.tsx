import axios from "axios";
import Link from "next/link";
import React, { useState } from "react";
import Alert from "./Alert";
import { Recipe } from "@/app/types";
const ButtonAction = (props: { recipeid: number; recipe: Recipe }) => {
  const [addedRecipe, setAddedRecipe] = useState(false);
  const addRecipeToDatabase = async () => {
    try {
      console.log(props.recipe);
      const response = await axios.post("/api/add-recipe", props.recipe);
      setAddedRecipe(true);
      console.log("Recipe added:", response.data);
    } catch (error) {
      console.error("Error adding recipe:", error);
    }
  };
  return (
    <div className="flex gap-3">
      <button className="btn btn-sm btn-secondary w-16 h-9">
        <Link href={`/recipe/${props.recipeid}`}>Info</Link>
      </button>
      <button
        className="btn btn-sm btn-primary w-16 h-9"
        onClick={addRecipeToDatabase}
      >
        Add
      </button>
      {addedRecipe && <Alert />}
    </div>
  );
};

export default ButtonAction;
