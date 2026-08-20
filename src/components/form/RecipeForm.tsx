import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { SubmitHandler, useFieldArray, useForm } from "react-hook-form";

type RecipeFormValues = {
  label: string;
  source: string;
  yield: number;
  totalTime: number;
  ingredientLines: { value: string }[];
};

// What the API actually receives: ingredientLines flattened to string[]
type RecipePayload = Omit<RecipeFormValues, "ingredientLines"> & {
  ingredientLines: string[];
};

export default function RecipeForm() {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RecipeFormValues>({
    defaultValues: {
      yield: 1,
      totalTime: 0,
      ingredientLines: [{ value: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "ingredientLines",
  });

  const {
    mutate: addRecipe,
    isPending,
    isError,
  } = useMutation({
    mutationFn: (data: RecipePayload) => axios.post("/api", data),
    onError: (error) => console.error("Error adding recipe:", error),
    onSuccess: () => console.log("Recipe added successfully"),
  });

  const onSubmit: SubmitHandler<RecipeFormValues> = (data) => {
    const payload: RecipePayload = {
      ...data,
      ingredientLines: data.ingredientLines.map((row) => row.value),
    };
    addRecipe(payload);
  };

  return (
    <div className="modal-box">
      {" "}
      <form
        onSubmit={handleSubmit(onSubmit)}
        method="dialog"
        className="modal-action flex w-full flex-col gap-4"
      >
        <h2 className="text-base-content text-2xl font-bold">New Recipe</h2>

        {/* Recipe name */}
        <div>
          <input
            className="input input-bordered w-full"
            placeholder="Recipe name"
            {...register("label", { required: "Name is required" })}
          />
          {errors.label && (
            <span className="text-error text-sm">{errors.label.message}</span>
          )}
        </div>

        {/* Source */}
        <div>
          <input
            className="input input-bordered w-full"
            placeholder="Source (e.g. your name, a website)"
            {...register("source")}
          />
        </div>

        {/* Servings + time */}
        <div className="flex gap-3">
          <div className="flex-1">
            <input
              type="number"
              className="input input-bordered w-full"
              placeholder="Servings"
              {...register("yield", {
                valueAsNumber: true,
                required: true,
                min: { value: 1, message: "Must serve at least 1" },
              })}
            />
            {errors.yield && (
              <span className="text-error text-sm">{errors.yield.message}</span>
            )}
          </div>
          <div className="flex-1">
            <input
              type="number"
              className="input input-bordered w-full"
              placeholder="Minutes"
              {...register("totalTime", { valueAsNumber: true, min: 0 })}
            />
          </div>
        </div>

        {/* Ingredients (dynamic list) */}
        <div className="flex flex-col gap-2">
          <label className="text-base-content font-medium">Ingredients</label>
          {fields.map((field, index) => (
            <div key={field.id} className="flex gap-2">
              <input
                className="input input-bordered flex-1"
                placeholder={`Ingredient ${index + 1}`}
                {...register(`ingredientLines.${index}.value`, {
                  required: true,
                })}
              />
              <button
                type="button"
                className="btn btn-square btn-ghost"
                onClick={() => remove(index)}
                disabled={fields.length === 1}
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            className="btn btn-outline btn-sm w-fit"
            onClick={() => append({ value: "" })}
          >
            + Add ingredient
          </button>
        </div>

        {isError && (
          <span className="text-error text-center">Could not save recipe.</span>
        )}

        <button type="submit" className="btn btn-primary" disabled={isPending}>
          {isPending ? (
            <span className="loading loading-spinner" />
          ) : (
            "Save Recipe"
          )}
        </button>
        <span className="text-error text-sm">{errors.label?.message}</span>
      </form>
    </div>
  );
}
