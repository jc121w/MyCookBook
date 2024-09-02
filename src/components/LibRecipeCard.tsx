import React from "react";
import Image from "next/image";
import { ButtonActionLib } from "./ButtonActionLib";
import { RecipeSimplified } from "@/app/types";
export const LibRecipeCard = (props: {
  title: string;
  src: string;
  cal: string;
  id: number;
  recipeDetails: RecipeSimplified;
}) => {
  return (
    <div className="card bg-base-100 w-64 shadow-xl">
      <figure className="overflow-hidden p-3 shadow-md shadow-slate-400">
        <Image
          src={props.src}
          alt=""
          width={225}
          height={0}
          className="w-fit rounded-lg"
        />
      </figure>
      <div className="card-body text-sm p-5">
        <h2 className="card-title">{props.title} </h2>
        <div className="card-actions justify-between mt-3 flex items-end w-full">
          <span className="text-lg font-semibold ">
            {String(props.cal).split(".")[0]} Cal
          </span>{" "}
          <ButtonActionLib recipeid={props.id} recipe={props.recipeDetails} />
        </div>
      </div>
    </div>
  );
};
LibRecipeCard.defaultProps = {
  title: "Default",
  src: "/no_image.png",
  cal: "0",
};
