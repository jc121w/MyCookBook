// Turns untrusted JSON from the recipe form into exactly the fields we store.
// Used by POST /api/recipes/custom (create) and PATCH /api/library/[id] (edit),
// so both follow the same rules. Server-only (it imports the UploadThing server helper).
import { cleanFileKey } from "@/lib/uploadthingServer";

// A list of non-empty, trimmed strings (anything else is dropped)
function stringList(
  value: unknown,
  maxItems = 100,
  maxLength = 1000,
): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is string => typeof v === "string")
    .map((v) => v.trim().slice(0, maxLength))
    .filter(Boolean)
    .slice(0, maxItems);
}

// A whole number ≥ min, or the fallback
function wholeNumber(value: unknown, min: number, fallback: number): number {
  const n = Number(value);
  return Number.isInteger(n) && n >= min ? n : fallback;
}

// One category, stored as a 1-item array (Edamam's shape), or [].
// Lowercase words only (e.g. "main course", "lunch/dinner"); our lists plus any
// value an Edamam recipe already had, so editing never silently drops it.
function category(value: unknown): string[] {
  return typeof value === "string" && /^[a-z][a-z /&-]{0,39}$/.test(value)
    ? [value]
    : [];
}

// Links and images: http(s) only (Edamam's source links are sometimes plain http)
const webUrl = (value: unknown) =>
  typeof value === "string" && /^https?:\/\//.test(value)
    ? value.slice(0, 2000)
    : null;

export type RecipeInput = {
  label: string;
  source: string;
  yield: number;
  totalTime: number;
  calories: number | null;
  image: string | null;
  imageKey: string | null;
  url: string | null;
  ingredientLines: string[];
  instructions: string[];
  dishType: string[];
  cuisineType: string[];
  mealType: string[];
};

export function parseRecipeInput(
  body: Record<string, unknown> | null,
): { ok: true; data: RecipeInput } | { ok: false; error: string } {
  if (!body) return { ok: false, error: "Invalid JSON" };

  const label = typeof body.label === "string" ? body.label.trim() : "";
  if (!label) return { ok: false, error: "A recipe name is required" };
  if (label.length > 200) return { ok: false, error: "That name is too long" };

  const servings = wholeNumber(body.yield, 1, 1);
  const caloriesPerServing = Number(body.caloriesPerServing);
  const image = webUrl(body.image);

  return {
    ok: true,
    data: {
      label,
      source:
        typeof body.source === "string" ? body.source.trim().slice(0, 200) : "",
      yield: servings,
      totalTime: wholeNumber(body.totalTime, 0, 0),
      // Stored for the WHOLE recipe, like Edamam, so per-serving math works everywhere
      calories:
        body.caloriesPerServing != null &&
        Number.isFinite(caloriesPerServing) &&
        caloriesPerServing >= 0
          ? caloriesPerServing * servings
          : null,
      image,
      imageKey: image ? cleanFileKey(body.imageKey) : null, // lets us delete the file later
      url: webUrl(body.url),
      ingredientLines: stringList(body.ingredientLines),
      instructions: stringList(body.instructions, 50, 2000),
      dishType: category(body.dishType),
      cuisineType: category(body.cuisineType),
      mealType: category(body.mealType),
    },
  };
}
