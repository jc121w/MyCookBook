import { FormEventHandler } from "react";
import { Form } from "react-hook-form";

export const RecipeForm = () => {
  const handleSubmit: FormEventHandler<HTMLFormElement> = () => {};
  return (
    <form className="flex flex-col py-4">
      <input type="text" placeholder="Recipe Name" />
    </form>
  );
};
