"use client";

import { Check, Clock, ExternalLink, Flame, Users } from "lucide-react";
import { useState, type ReactNode } from "react";
import type { BookWithCount, Recipe } from "@/app/types";

// Edamam nutrient codes → what we show. Order = display order.
const MACROS = [
  { key: "PROCNT", label: "Protein" },
  { key: "CHOCDF", label: "Carbs" },
  { key: "FAT", label: "Fat" },
] as const;

const DETAILS = [
  { key: "SUGAR", label: "Sugar" },
  { key: "FIBTG", label: "Fiber" },
  { key: "FASAT", label: "Saturated fat" },
  { key: "CHOLE", label: "Cholesterol" },
  { key: "NA", label: "Sodium" },
] as const;

type Nutrients = Recipe["totalNutrients"];

export function RecipePage({ book }: { book: BookWithCount }) {
  // The DB column is Prisma `Json`, so TypeScript only knows it as JsonValue.
  // We know it has Edamam's shape, so narrow it here, at the boundary.
  const nutrients = book.totalNutrients as Nutrients | null;
  const servings = book.yield > 0 ? book.yield : 1;

  // Per-serving amount of one nutrient, or null if the recipe doesn't have it
  function perServing(key: string) {
    const n = nutrients?.[key];
    return n ? { value: n.quantity / servings, unit: n.unit } : null;
  }

  const calories =
    book.calories != null ? Math.round(book.calories / servings) : null;
  const macros = MACROS.map((m) => ({
    ...m,
    amount: perServing(m.key),
  })).filter((m) => m.amount);
  const details = DETAILS.map((d) => ({
    ...d,
    amount: perServing(d.key),
  })).filter((d) => d.amount);

  return (
    <div className="flex flex-col gap-6 pt-2 pb-2">
      <div>
        <p className="text-xs font-semibold tracking-widest uppercase opacity-60">
          The recipe
        </p>
        <div className="divider my-0" />
      </div>

      {/* ── Quick facts ── */}
      <div className="bg-base-200/60 divide-base-300 grid grid-cols-3 divide-x rounded-lg py-3 text-center">
        <Fact
          icon={<Clock className="h-4 w-4" />}
          value={book.totalTime > 0 ? `${book.totalTime}` : "—"}
          unit={book.totalTime > 0 ? "min" : ""}
          label="Time"
        />
        <Fact
          icon={<Users className="h-4 w-4" />}
          value={`${book.yield || "—"}`}
          label="Servings"
        />
        <Fact
          icon={<Flame className="h-4 w-4" />}
          value={calories != null ? `${calories}` : "—"}
          label="Cal / serving"
        />
      </div>

      {/* ── Nutrition ── */}
      {(macros.length > 0 || details.length > 0) && (
        <Section title="Nutrition" aside="per serving">
          {macros.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {macros.map((m) => (
                <div
                  key={m.key}
                  className="border-base-300 rounded-lg border px-2 py-2.5 text-center"
                >
                  <p className="font-serif text-xl leading-none font-semibold">
                    {format(m.amount!.value)}
                    <span className="ml-0.5 text-xs font-normal opacity-60">
                      {m.amount!.unit}
                    </span>
                  </p>
                  <p className="mt-1 text-xs opacity-60">{m.label}</p>
                </div>
              ))}
            </div>
          )}

          {details.length > 0 && (
            <dl className="divide-base-300 mt-1 divide-y text-sm">
              {details.map((d) => (
                <div key={d.key} className="flex justify-between py-1.5">
                  <dt className="opacity-70">{d.label}</dt>
                  <dd className="font-medium tabular-nums">
                    {format(d.amount!.value)} {d.amount!.unit}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </Section>
      )}

      {/* ── Ingredients ── */}
      <Section
        title="Ingredients"
        aside={
          book.ingredientLines.length > 0
            ? `${book.ingredientLines.length} items`
            : undefined
        }
      >
        {book.ingredientLines.length > 0 ? (
          <IngredientList lines={book.ingredientLines} />
        ) : (
          <p className="text-sm italic opacity-40">No ingredients saved</p>
        )}
      </Section>

      {/* ── Instructions ── */}
      <Section title="Instructions">
        {book.url ? (
          <a
            href={book.url}
            target="_blank"
            rel="noopener noreferrer"
            className="border-base-300 hover:bg-base-200 flex items-center justify-between gap-3 rounded-lg border px-4 py-3 transition-colors"
          >
            <span className="text-sm">
              Step-by-step on{" "}
              <span className="font-semibold">
                {book.source || "the original site"}
              </span>
            </span>
            <ExternalLink className="h-4 w-4 shrink-0 opacity-60" />
          </a>
        ) : (
          <p className="text-sm italic opacity-40">No instructions saved</p>
        )}
      </Section>
    </div>
  );
}

// Tap an ingredient to tick it off while you cook (resets when the book closes)
function IngredientList({ lines }: { lines: string[] }) {
  const [done, setDone] = useState<Set<number>>(new Set());

  function toggle(i: number) {
    setDone((prev) => {
      const next = new Set(prev); // copy: never mutate state directly
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  return (
    <ul className="divide-base-300 divide-y">
      {lines.map((line, i) => {
        const checked = done.has(i);
        return (
          // Lines can repeat ("salt"), so the index is part of the key
          <li key={`${i}-${line}`}>
            <button
              type="button"
              onClick={() => toggle(i)}
              className="flex w-full items-start gap-3 py-2 text-left"
            >
              <span
                className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded border transition-colors ${
                  checked
                    ? "bg-primary border-primary text-primary-content"
                    : "border-base-content/30"
                }`}
              >
                {checked && <Check className="h-3 w-3" strokeWidth={3} />}
              </span>
              <span
                className={`font-serif leading-snug ${checked ? "line-through opacity-40" : ""}`}
              >
                {line}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

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
    <section className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <h3 className="font-serif text-lg font-semibold">{title}</h3>
        {aside && <span className="text-xs opacity-50">{aside}</span>}
      </div>
      {children}
    </section>
  );
}

function Fact({
  icon,
  value,
  unit,
  label,
}: {
  icon: ReactNode;
  value: string;
  unit?: string;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5 px-1">
      <span className="opacity-50">{icon}</span>
      <p className="font-serif text-lg leading-tight font-semibold">
        {value}
        {unit && (
          <span className="ml-0.5 text-xs font-normal opacity-60">{unit}</span>
        )}
      </p>
      <p className="text-[11px] opacity-60">{label}</p>
    </div>
  );
}

// 0.43 → "0.4", 12.6 → "13": one decimal only for small amounts
function format(n: number) {
  return n < 10 ? String(Math.round(n * 10) / 10) : String(Math.round(n));
}
