import React from "react";
import { ButtonAction } from "../ButtonAction";
import Image from "next/image";
import { title } from "process";
import { Recipe } from "@/app/types";
export const RecipeCard = (props: {
  title: string;
  src: string;
  cal: string;
  id: number;
  recipe: Recipe;
}) => {
  return (
    <div className="card h-72 w-96 bg-primary text-primary-content shadow-xl">
      <figure className="overflow-hidden shadow-md shadow-slate-400">
        <img src={props.src} alt="" className="rounded-lg object-cover" />
      </figure>
      <div className="card-body p-5 text-sm">
        <h2 className="card-title">{props.title} </h2>
        <div className="card-actions mt-3 flex w-full items-end justify-between">
          <span className="font-semibold">
            <span className="text-lg">{String(props.cal).split(".")[0]}</span>{" "}
            Cal
          </span>
          <ButtonAction recipeid={props.id} recipe={props.recipe} />
        </div>
      </div>
    </div>
  );
};
RecipeCard.defaultProps = {
  title: "Default",
  src: "/no_image.png",
  cal: "0",
};
