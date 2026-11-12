import { BackButton } from "@/components/BackButton";
import { Recipe } from "@/app/types";
import { ExternalLink } from "lucide-react";
import { perServing, perServingDV } from "@/lib/utils/recipe";

function getNutrient(recipe: Recipe, key: string): number {
  return Math.round(recipe.totalNutrients[key]?.quantity ?? 0);
}
type RecipeDetailProps = {
  recipe: {
    label: string;
    image: string | null;
    source: string;
    yield: number;
    ingredientLines: string[];
    url: string | null; // Edamam-only, so nullable
    totalNutrients: Recipe["totalNutrients"] | null;
    totalDaily: Recipe["totalDaily"] | null;
    dietLabels: string[];
    cuisineType: string[];
    mealType: string[];
  };
};
const KEY_NUTRIENTS: { key: string; label: string }[] = [
  { key: "ENERC_KCAL", label: "Calories" },
  { key: "FAT", label: "Total Fat" },
  { key: "FASAT", label: "Saturated Fat" },
  { key: "CHOCDF", label: "Carbohydrates" },
  { key: "FIBTG", label: "Fiber" },
  { key: "SUGAR", label: "Sugars" },
  { key: "PROCNT", label: "Protein" },
  { key: "NA", label: "Sodium" },
  { key: "CHOLE", label: "Cholesterol" },
];

function NutritionPanel({
  recipe,
}: {
  recipe: {
    totalNutrients: Recipe["totalNutrients"] | null;
    totalDaily: Recipe["totalDaily"] | null;
    yield: number;
  };
}) {
  return (
    <>
      <h2 className="mb-1 text-2xl font-semibold">Nutrition Facts</h2>
      <p className="text-base-content/60 mb-4 text-sm">
        Per serving · recipe makes {recipe.yield}
      </p>
      <div className="border-base-300 bg-base-100 overflow-hidden rounded-xl border">
        <table className="table">
          <thead>
            <tr>
              <th>Nutrient</th>
              <th className="text-right">Amount</th>
              <th className="text-right">% DV</th>
            </tr>
          </thead>
          {recipe.totalNutrients && (
            <tbody>
              {KEY_NUTRIENTS.map(({ key, label }) => {
                const n = recipe.totalNutrients![key];
                if (!n) return null;
                const amount = Math.round(n.quantity / recipe.yield);
                const dv = perServingDV(recipe, key);
                return (
                  <tr key={key}>
                    <td className="font-medium">{label}</td>
                    <td className="text-right">
                      {amount}
                      {n.unit}
                    </td>
                    <td className="text-base-content/60 text-right">
                      {dv > 0 ? `${dv}%` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          )}
        </table>
      </div>
    </>
  );
}
export const RecipeDetail = ({ recipe }: RecipeDetailProps) => (
  <div className="mx-auto max-w-4xl px-4 pb-16">
    <BackButton />
    {/* Header: image + at-a-glance stats side by side */}
    <div className="mt-6 grid gap-8 lg:grid-cols-2">
      {recipe.image && (
        <img
          src={recipe.image}
          alt={recipe.label}
          className="ring-base-300 aspect-[4/3] w-full rounded-2xl object-cover shadow-sm ring-1"
        />
      )}

      <div className="flex flex-col gap-5">
        <div>
          <h1 className="text-3xl leading-tight font-bold text-pretty">
            {recipe.label}
          </h1>
          <p className="text-base-content/60 mt-1 text-sm">
            from {recipe.source} · serves {recipe.yield}
          </p>
        </div>

        {/* Macros as a proper stats block — per serving */}
        <div className="stats stats-vertical ring-base-300 sm:stats-horizontal w-full shadow-sm ring-1">
          <div className="stat">
            <div className="stat-title">Calories</div>
            <div className="stat-value text-primary">
              {perServing(recipe, "ENERC_KCAL")}
            </div>
            <div className="stat-desc">per serving</div>
          </div>
          <div className="stat">
            <div className="stat-title">Protein</div>
            <div className="stat-value text-2xl">
              {perServing(recipe, "PROCNT")}g
            </div>
            <div className="stat-desc">
              {perServingDV(recipe, "PROCNT")}% DV
            </div>
          </div>
          <div className="stat">
            <div className="stat-title">Carbs</div>
            <div className="stat-value text-2xl">
              {perServing(recipe, "CHOCDF")}g
            </div>
            <div className="stat-desc">
              {perServingDV(recipe, "CHOCDF")}% DV
            </div>
          </div>
        </div>

        {/* Diet labels: one accent color; health labels quiet */}
        {recipe.dietLabels.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {recipe.dietLabels.map((label) => (
              <span key={label} className="badge badge-primary badge-outline">
                {label}
              </span>
            ))}
          </div>
        )}

        <div className="text-base-content/60 flex flex-wrap gap-x-2 gap-y-1 text-sm">
          {[...(recipe.cuisineType ?? []), ...(recipe.mealType ?? [])]
            .filter(Boolean)
            .map((t, i) => (
              <span key={t} className="capitalize">
                {i > 0 && "· "}
                {t}
              </span>
            ))}
        </div>
      </div>
    </div>
    {/* Ingredients — surfaces use base-100 on the base-200 page, base-300 borders */}
    <h2 className="mt-12 mb-4 text-2xl font-semibold">Ingredients</h2>
    <ul className="grid gap-2 sm:grid-cols-2">
      {recipe.ingredientLines.map((line, i) => (
        <li
          key={i}
          className="border-base-300 bg-base-100 rounded-lg border p-3 text-sm"
        >
          {line}
        </li>
      ))}
    </ul>
    <div className="my-10">
      {recipe.url && (
        <a
          href={recipe.url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary gap-2"
        >
          <ExternalLink size={18} />
          View full instructions on {recipe.source}
        </a>
      )}
      <p className="text-base-content/60 mt-2 text-sm">
        Edamam provides ingredients and nutrition — full cooking steps are on
        the original site.
      </p>
      <NutritionPanel recipe={recipe} />
    </div>{" "}
  </div>
);
