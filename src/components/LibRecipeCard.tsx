import React from "react";
import ButtonAction from "./ButtonAction";
import Image from "next/image";
import { title } from "process";
import { Recipe } from "@/app/types";
const RecipeCard = (props: {
  title: string;
  src: string;
  cal: string;
  id: number;
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
        <div className="card-actions justify-between mt-3 flex items-center w-full">
          <span className=" font-semibold">
            <span className="text-lg">{String(props.cal).split(".")[0]}</span>{" "}
            Cal
          </span>
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
export default RecipeCard;
