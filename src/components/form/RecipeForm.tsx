"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Plus, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useFieldArray, useForm, type SubmitHandler } from "react-hook-form";
import { PhotoPicker } from "@/components/form/PhotoPicker";
import {
  CUISINE_TYPES,
  DISH_TYPES,
  MEAL_TYPES,
  titleCase,
} from "@/lib/recipeOptions";
import { useUploadThing } from "@/lib/uploadthing";

const MAX_PHOTO_MB = 8; // keep in sync with api/uploadthing/core.ts

type RecipeFormValues = {
  label: string;
  source: string;
  url: string;
  yield: number;
  totalTime: number | undefined;
  caloriesPerServing: number | undefined;
  dishType: string;
  cuisineType: string;
  mealType: string;
  // useFieldArray needs objects, so each line is { value }
  ingredientLines: { value: string }[];
  instructions: { value: string }[];
};

const EMPTY: RecipeFormValues = {
  label: "",
  source: "",
  url: "",
  yield: 2,
  totalTime: undefined,
  caloriesPerServing: undefined,
  dishType: "",
  cuisineType: "",
  mealType: "",
  ingredientLines: [{ value: "" }],
  instructions: [{ value: "" }],
};

// Empty number inputs become undefined instead of NaN (NaN would crash the save)
const toNumber = (v: string) => (v === "" ? undefined : Number(v));

type RecipeFormProps = {
  onDone: () => void; // close the dialog (after saving or cancelling)
};

export default function RecipeForm({ onDone }: RecipeFormProps) {
  const queryClient = useQueryClient();
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RecipeFormValues>({ defaultValues: EMPTY });

  const ingredients = useFieldArray({ control, name: "ingredientLines" });
  const steps = useFieldArray({ control, name: "instructions" });

  const [photo, setPhoto] = useState<File | null>(null);
  const { startUpload } = useUploadThing("recipePhoto");

  const save = useMutation({
    mutationFn: async (values: RecipeFormValues) => {
      // 1. Photo goes straight to UploadThing; we keep only its URL
      let image: string | null = null;
      let imageKey: string | null = null;
      if (photo) {
        const uploaded = await startUpload([photo]);
        image = uploaded?.[0]?.ufsUrl ?? null;
        imageKey = uploaded?.[0]?.key ?? null; // needed to delete the file later
        if (!image) throw new Error("The photo didn't upload. Try again.");
      }
      // 2. Flatten the { value } rows to plain strings and drop empty ones
      const lines = (rows: { value: string }[]) =>
        rows.map((r) => r.value.trim()).filter(Boolean);

      return axios.post("/api/recipes/custom", {
        label: values.label,
        source: values.source,
        url: values.url || null,
        yield: values.yield,
        totalTime: values.totalTime ?? 0,
        caloriesPerServing: values.caloriesPerServing ?? null,
        dishType: values.dishType || null,
        cuisineType: values.cuisineType || null,
        mealType: values.mealType || null,
        ingredientLines: lines(values.ingredientLines),
        instructions: lines(values.instructions),
        image,
        imageKey,
      });
    },
    onSuccess: async () => {
      // Refetch the shelf so the new book appears, then clear and close
      await queryClient.invalidateQueries({ queryKey: ["recipes"] });
      close();
    },
  });

  function close() {
    reset(EMPTY);
    setPhoto(null);
    save.reset();
    onDone();
  }

  const onSubmit: SubmitHandler<RecipeFormValues> = (values) =>
    save.mutate(values);

  return (
    <div className="modal-box flex max-h-[90vh] max-w-xl flex-col p-0">
      {/* ── Header ── */}
      <div className="border-base-300 flex items-start justify-between border-b px-6 pt-5 pb-4">
        <div>
          <h2 className="font-serif text-2xl font-bold">Create recipe</h2>
          <p className="mt-0.5 text-sm opacity-60">
            It becomes a new book on your shelf.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-sm btn-circle btn-ghost"
          onClick={close}
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* ── Body (scrolls) ── */}
      <form
        id="recipe-form"
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-1 flex-col gap-8 overflow-y-auto px-6 py-5"
      >
        <Section title="Basics">
          <Field label="Recipe name" required error={errors.label?.message}>
            <input
              className="input w-full"
              placeholder="e.g. Grandma's Lasagna"
              autoFocus
              {...register("label", {
                required: "Give your recipe a name",
                validate: (v) => v.trim() !== "" || "Give your recipe a name",
                maxLength: {
                  value: 200,
                  message: "Keep it under 200 characters",
                },
              })}
            />
          </Field>
          <Field label="Source" hint="Who or where it's from">
            <input
              className="input w-full"
              placeholder="Grandma, a cookbook, a website…"
              {...register("source")}
            />
          </Field>
          <Field
            label="Link"
            hint="Optional: the original recipe page"
            error={errors.url?.message}
          >
            <input
              type="url"
              className="input w-full"
              placeholder="https://"
              {...register("url", {
                pattern: {
                  value: /^https:\/\//,
                  message: "Links must start with https://",
                },
              })}
            />
          </Field>
        </Section>

        <Section title="Photo" aside="optional">
          <PhotoPicker
            file={photo}
            onChange={setPhoto}
            maxMb={MAX_PHOTO_MB}
            aspect="aspect-[3/1]"
          />
        </Section>

        <Section title="Details">
          <div className="grid grid-cols-3 gap-3">
            <Field label="Servings" required error={errors.yield?.message}>
              <input
                type="number"
                inputMode="numeric"
                className="input w-full"
                {...register("yield", {
                  setValueAs: toNumber,
                  required: "Required",
                  min: { value: 1, message: "At least 1" },
                })}
              />
            </Field>
            <Field
              label="Total time"
              hint="minutes"
              error={errors.totalTime?.message}
            >
              <input
                type="number"
                inputMode="numeric"
                className="input w-full"
                placeholder="45"
                {...register("totalTime", {
                  setValueAs: toNumber,
                  min: { value: 0, message: "Can't be negative" },
                })}
              />
            </Field>
            <Field
              label="Calories"
              hint="per serving"
              error={errors.caloriesPerServing?.message}
            >
              <input
                type="number"
                inputMode="numeric"
                className="input w-full"
                placeholder="520"
                {...register("caloriesPerServing", {
                  setValueAs: toNumber,
                  min: { value: 0, message: "Can't be negative" },
                })}
              />
            </Field>
          </div>
        </Section>

        <Section title="Shelf" aside="decides where the book goes">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label="Dish type">
              <Select options={DISH_TYPES} {...register("dishType")} />
            </Field>
            <Field label="Cuisine">
              <Select options={CUISINE_TYPES} {...register("cuisineType")} />
            </Field>
            <Field label="Meal">
              <Select options={MEAL_TYPES} {...register("mealType")} />
            </Field>
          </div>
        </Section>

        <Section title="Ingredients" aside="press Enter for the next line">
          <ol className="flex flex-col gap-2">
            {ingredients.fields.map((field, index) => (
              <li key={field.id} className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="w-5 text-center text-sm opacity-40"
                >
                  •
                </span>
                <input
                  className="input w-full"
                  placeholder={
                    index === 0
                      ? "e.g. 2 cups flour"
                      : `Ingredient ${index + 1}`
                  }
                  aria-label={`Ingredient ${index + 1}`}
                  {...register(`ingredientLines.${index}.value`)}
                  onKeyDown={(e) => {
                    // Enter adds a new line (and focuses it) instead of submitting
                    if (e.key === "Enter") {
                      e.preventDefault();
                      ingredients.insert(index + 1, { value: "" });
                    }
                  }}
                />
                <RemoveButton
                  label={`Remove ingredient ${index + 1}`}
                  disabled={ingredients.fields.length === 1}
                  onClick={() => ingredients.remove(index)}
                />
              </li>
            ))}
          </ol>
          <AddButton onClick={() => ingredients.append({ value: "" })}>
            Add ingredient
          </AddButton>
        </Section>

        <Section title="Instructions" aside="optional">
          <ol className="flex flex-col gap-2">
            {steps.fields.map((field, index) => (
              <li key={field.id} className="flex items-start gap-2">
                <span className="bg-base-200 mt-2 grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-semibold">
                  {index + 1}
                </span>
                <textarea
                  rows={2}
                  className="textarea w-full leading-relaxed"
                  placeholder={
                    index === 0
                      ? "e.g. Preheat the oven to 375°F."
                      : `Step ${index + 1}`
                  }
                  aria-label={`Step ${index + 1}`}
                  {...register(`instructions.${index}.value`)}
                />
                <RemoveButton
                  label={`Remove step ${index + 1}`}
                  disabled={steps.fields.length === 1}
                  onClick={() => steps.remove(index)}
                />
              </li>
            ))}
          </ol>
          <AddButton onClick={() => steps.append({ value: "" })}>
            Add step
          </AddButton>
        </Section>

        {save.error && (
          <p className="text-error text-sm">
            {axios.isAxiosError(save.error)
              ? (save.error.response?.data?.error ??
                "Couldn't save the recipe.")
              : save.error.message}
          </p>
        )}
      </form>

      {/* ── Footer (always visible) ── */}
      <div className="border-base-300 flex items-center justify-end gap-2 border-t px-6 py-3">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={close}
          disabled={save.isPending}
        >
          Cancel
        </button>
        {/* form="recipe-form" lets a button outside the <form> submit it */}
        <button
          type="submit"
          form="recipe-form"
          className="btn btn-primary"
          disabled={save.isPending}
        >
          {save.isPending ? (
            <>
              <span className="loading loading-spinner loading-sm" />
              {photo ? "Uploading photo…" : "Saving…"}
            </>
          ) : (
            "Save recipe"
          )}
        </button>
      </div>
    </div>
  );
}

// ── Small building blocks ──

function Section({
  title,
  aside,
  children,
}: {
  title: string;
  aside?: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-xs font-semibold tracking-widest uppercase opacity-70">
          {title}
        </h3>
        {aside && <span className="text-xs opacity-50">{aside}</span>}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  hint,
  required,
  error,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">
        {label}
        {required && <span className="text-error ml-0.5">*</span>}
        {hint && <span className="ml-1.5 font-normal opacity-50">{hint}</span>}
      </span>
      {children}
      {error && <span className="text-error text-xs">{error}</span>}
    </label>
  );
}

// register(...) returns { name, ref, onChange, onBlur }, which we pass straight through
function Select({
  options,
  ...field
}: { options: readonly string[] } & ReturnType<
  ReturnType<typeof useForm>["register"]
>) {
  return (
    <select className="select w-full" {...field}>
      <option value="">Not set</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {titleCase(o)}
        </option>
      ))}
    </select>
  );
}

function RemoveButton({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="btn btn-square btn-ghost btn-sm shrink-0 opacity-60 hover:opacity-100"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
    >
      <X className="h-4 w-4" />
    </button>
  );
}

function AddButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className="btn btn-ghost btn-sm w-fit gap-1.5"
      onClick={onClick}
    >
      <Plus className="h-4 w-4" /> {children}
    </button>
  );
}
