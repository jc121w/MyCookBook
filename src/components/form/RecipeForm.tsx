"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Plus, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useFieldArray, useForm, type SubmitHandler } from "react-hook-form";
import type { BookWithCount } from "@/app/types";
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

// Editing: turn a saved recipe back into form values
function valuesFrom(recipe: BookWithCount): RecipeFormValues {
  const rows = (lines: string[]) =>
    lines.length > 0 ? lines.map((value) => ({ value })) : [{ value: "" }];
  return {
    label: recipe.label,
    source: recipe.source ?? "",
    url: recipe.url ?? "",
    yield: recipe.yield || 1,
    totalTime: recipe.totalTime || undefined,
    // Stored for the whole recipe; the form asks per serving
    caloriesPerServing:
      recipe.calories != null
        ? Math.round(recipe.calories / (recipe.yield || 1))
        : undefined,
    dishType: recipe.dishType[0] ?? "",
    cuisineType: recipe.cuisineType[0] ?? "",
    mealType: recipe.mealType[0] ?? "",
    ingredientLines: rows(recipe.ingredientLines),
    instructions: rows(recipe.instructions),
  };
}

// Empty number inputs become undefined instead of NaN (NaN would crash the save)
const toNumber = (v: string) => (v === "" ? undefined : Number(v));

type RecipeFormProps = {
  onDone: () => void; // close (after saving or cancelling)
  recipe?: BookWithCount; // pass one to EDIT it; leave out to CREATE
  variant?: "modal" | "panel"; // inside the create dialog, or inside an open book
};

export default function RecipeForm({
  onDone,
  recipe,
  variant = "modal",
}: RecipeFormProps) {
  const editing = recipe != null;
  const queryClient = useQueryClient();
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RecipeFormValues>({
    defaultValues: recipe ? valuesFrom(recipe) : EMPTY,
  });

  const ingredients = useFieldArray({ control, name: "ingredientLines" });
  const steps = useFieldArray({ control, name: "instructions" });

  // Photo: a newly picked file, and (when editing) the photo already saved
  const [photo, setPhoto] = useState<File | null>(null);
  const [savedImage, setSavedImage] = useState({
    url: recipe?.image ?? null,
    key: recipe?.imageKey ?? null,
  });
  const { startUpload } = useUploadThing("recipePhoto");

  const save = useMutation({
    mutationFn: async (values: RecipeFormValues) => {
      // 1. A new photo goes straight to UploadThing; otherwise keep the saved one (if any)
      let image = savedImage.url;
      let imageKey = savedImage.key;
      if (photo) {
        const uploaded = await startUpload([photo]);
        image = uploaded?.[0]?.ufsUrl ?? null;
        imageKey = uploaded?.[0]?.key ?? null;
        if (!image) throw new Error("The photo didn't upload. Try again.");
      }
      // 2. Flatten the { value } rows to plain strings and drop empty ones
      const lines = (rows: { value: string }[]) =>
        rows.map((r) => r.value.trim()).filter(Boolean);

      const payload = {
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
      };
      return editing
        ? axios.patch(`/api/library/${recipe.id}`, payload)
        : axios.post("/api/recipes/custom", payload);
    },
    onSuccess: async () => {
      // Refetch the shelf: a new book appears, or the open book shows the edits
      await queryClient.invalidateQueries({ queryKey: ["recipes"] });
      close();
    },
  });

  function close() {
    if (!editing) {
      reset(EMPTY);
      setPhoto(null);
    }
    save.reset();
    onDone();
  }

  const onSubmit: SubmitHandler<RecipeFormValues> = (values) =>
    save.mutate(values);
  const formId = editing ? `recipe-form-${recipe.id}` : "recipe-form";

  // Keep a category the recipe already has even if it isn't in our list (Edamam has more)
  const withCurrent = (list: readonly string[], current?: string) =>
    current && !list.includes(current) ? [current, ...list] : list;
  const current = recipe ? valuesFrom(recipe) : EMPTY;

  return (
    <div
      className={
        variant === "modal"
          ? "modal-box flex max-h-[90vh] max-w-xl flex-col p-0"
          : "flex h-full flex-col"
      }
    >
      {/* ── Header ── */}
      <div className="border-base-300 flex items-start justify-between border-b px-6 pt-4 pb-3">
        <div>
          <h2
            className={`font-serif font-bold ${variant === "modal" ? "text-2xl" : "text-xl"}`}
          >
            {editing ? "Edit recipe" : "Create recipe"}
          </h2>
          <p className="mt-0.5 text-sm opacity-60">
            {editing
              ? "Change anything, or add what's missing."
              : "It becomes a new book on your shelf."}
          </p>
        </div>
        {/* In the dialog it needs its own ✕; inside a book, the book's ✕ and Cancel are enough */}
        {variant === "modal" && (
          <button
            type="button"
            className="btn btn-sm btn-circle btn-ghost"
            onClick={close}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* ── Body (scrolls) ── */}
      <form
        id={formId}
        onSubmit={handleSubmit(onSubmit)}
        className="flex min-h-0 flex-1 flex-col gap-8 overflow-y-auto px-6 py-5"
      >
        <Section title="Basics">
          <Field label="Recipe name" required error={errors.label?.message}>
            <input
              className="input w-full"
              placeholder="e.g. Grandma's pie"
              autoFocus={!editing}
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
              placeholder="Grandma, a blog…"
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
                  value: /^https?:\/\//,
                  message: "Links start with https:// or http://",
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
            currentUrl={savedImage.url}
            onClearCurrent={() => setSavedImage({ url: null, key: null })}
          />
        </Section>

        <Section title="Details">
          {/* One-line labels + units inside the inputs, so all three inputs line up */}
          {/* Phones: Servings + Time side by side, Calories below. Wider: all three in a row */}
          <div className="grid grid-cols-2 items-start gap-3 sm:grid-cols-3">
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
            <Field label="Total time" error={errors.totalTime?.message}>
              <UnitInput unit="min">
                <input
                  type="number"
                  inputMode="numeric"
                  className="w-full min-w-0"
                  placeholder="45"
                  {...register("totalTime", {
                    setValueAs: toNumber,
                    min: { value: 0, message: "Can't be negative" },
                  })}
                />
              </UnitInput>
            </Field>
            <Field
              label="Calories"
              error={errors.caloriesPerServing?.message}
              className="col-span-2 sm:col-span-1"
            >
              <UnitInput unit="/ serving">
                <input
                  type="number"
                  inputMode="numeric"
                  className="w-full min-w-0"
                  placeholder="520"
                  {...register("caloriesPerServing", {
                    setValueAs: toNumber,
                    min: { value: 0, message: "Can't be negative" },
                  })}
                />
              </UnitInput>
            </Field>
          </div>
        </Section>

        <Section title="Shelf" aside="decides where the book goes">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label="Dish type">
              <Select
                options={withCurrent(DISH_TYPES, current.dishType)}
                {...register("dishType")}
              />
            </Field>
            <Field label="Cuisine">
              <Select
                options={withCurrent(CUISINE_TYPES, current.cuisineType)}
                {...register("cuisineType")}
              />
            </Field>
            <Field label="Meal">
              <Select
                options={withCurrent(MEAL_TYPES, current.mealType)}
                {...register("mealType")}
              />
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
                    index === 0 ? "2 cups flour" : `Ingredient ${index + 1}`
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
        {/* form={formId} lets a button outside the <form> submit it */}
        <button
          type="submit"
          form={formId}
          className="btn btn-primary"
          disabled={save.isPending}
        >
          {save.isPending ? (
            <>
              <span className="loading loading-spinner loading-sm" />
              {photo ? "Uploading photo…" : "Saving…"}
            </>
          ) : editing ? (
            "Save changes"
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
  className = "",
}: {
  label: string;
  hint?: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="truncate text-sm font-medium">
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

// An input with a quiet unit at the end: [ 45        min ]
// (DaisyUI styles the wrapper as the input box; the real <input> sits inside it)
function UnitInput({ unit, children }: { unit: string; children: ReactNode }) {
  return (
    <span className="input w-full">
      {children}
      <span className="shrink-0 text-xs whitespace-nowrap opacity-50">
        {unit}
      </span>
    </span>
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
