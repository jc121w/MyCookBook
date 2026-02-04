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
    <div className="card w-64 bg-base-100 shadow-xl">
      <figure className="overflow-hidden p-3 shadow-md shadow-slate-400">
        <Image
          src={props.src}
          alt=""
          width={225}
          height={0}
          className="w-fit rounded-lg"
        />
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
