"use client";

import { Star } from "lucide-react";
import { useEffect, useState } from "react";

const STARS = [1, 2, 3, 4, 5];

// 4.25 → 4.3 (ratings have one decimal place)
export const roundRating = (n: number) => Math.round(n * 10) / 10;

// Five stars, filled to any fraction: 4.3 → four full stars and 30% of the fifth.
// Two identical rows stacked: gray outlines underneath, gold filled stars on top,
// with the gold row clipped to (value / 5) of the width.
function StarRow({
  value,
  size,
  gap,
}: {
  value: number;
  size: number;
  gap: number;
}) {
  const percent = (Math.max(0, Math.min(5, value)) / 5) * 100;
  const row = (className: string) => (
    <span className="flex" style={{ gap }}>
      {STARS.map((n) => (
        <Star
          key={n}
          aria-hidden
          style={{ width: size, height: size }}
          className={`shrink-0 ${className}`}
          strokeWidth={1.6}
        />
      ))}
    </span>
  );
  return (
    <span className="relative inline-flex">
      {row("text-base-content/20")}
      <span
        className="absolute inset-y-0 left-0 overflow-hidden"
        style={{ width: `${percent}%` }}
      >
        {row("fill-amber-400 text-amber-400")}
      </span>
    </span>
  );
}

// Read-only: ★★★★☆ 4.3
export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span
      className="inline-flex items-center gap-1.5"
      aria-label={`${value} out of 5 stars`}
    >
      <StarRow value={value} size={size} gap={2} />
      <span
        className="font-semibold tabular-nums opacity-70"
        style={{ fontSize: Math.max(11, size * 0.8) }}
      >
        {value.toFixed(1)}
      </span>
    </span>
  );
}

// Pick a rating: tap or drag along the stars for half-star steps (0.5, 1.0 … 5.0),
// or type an exact rating (to 0.1) in the small box next to them.
// The stars are a real <input type="range"> laid invisibly over the drawing, so mouse,
// touch and keyboard (←/→) all work without custom pointer math.
export function StarInput({
  value,
  onChange,
  size = 30,
}: {
  value: number | null;
  onChange: (rating: number | null) => void;
  size?: number;
}) {
  // While a mouse hovers, preview the half-star under the pointer; leave → real value
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover ?? value ?? 0;
  const SIZE = size;
  const GAP = Math.round(size / 7);
  const width = SIZE * 5 + GAP * 4;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-3">
        <div className="relative" style={{ width, height: SIZE }}>
          <StarRow value={shown} size={SIZE} gap={GAP} />
          <input
            type="range"
            min={0}
            max={5}
            step={0.5}
            // The REAL value, not the hover preview. If this followed the preview, clicking
            // where you're hovering wouldn't change the input's value, so no change event
            // would fire and the click would be lost.
            value={value ?? 0}
            onChange={(e) => {
              const next = roundRating(Number(e.target.value));
              onChange(next === 0 ? null : next); // far left = not rated
            }}
            onPointerMove={(e) => {
              if (e.pointerType !== "mouse") return; // touch has no hover; the drag itself previews
              const box = e.currentTarget.getBoundingClientRect();
              const fraction = Math.min(
                1,
                Math.max(0, (e.clientX - box.left) / box.width),
              );
              setHover(Math.round(fraction * 10) / 2); // nearest half star, same as a click
            }}
            onPointerLeave={() => setHover(null)}
            aria-label="Rating in half stars"
            aria-valuetext={value ? `${value} out of 5` : "Not rated"}
            // A native thumb is ~16px wide and values are measured from its center, which
            // skews taps near the ends. A 1px thumb makes the value match the finger.
            className="absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0 [&::-moz-range-thumb]:h-full [&::-moz-range-thumb]:w-px [&::-moz-range-thumb]:border-0 [&::-webkit-slider-thumb]:h-full [&::-webkit-slider-thumb]:w-px [&::-webkit-slider-thumb]:appearance-none"
          />
        </div>
        {/* The exact number: follows the stars (and the hover preview) */}
        <ExactRating value={value} preview={hover} onChange={onChange} />
      </div>

      {/* The word sits under the stars, as a quiet caption */}
      <span className="h-5 font-serif text-sm italic opacity-60">
        {label(shown || null)}
      </span>
    </div>
  );
}

// The small "4.3 / 5" box. It always shows the current rating: tapping or hovering the
// stars updates it. You can also type an exact rating (0.1–5); it saves as you type.
function ExactRating({
  value,
  preview,
  onChange,
}: {
  value: number | null;
  preview: number | null; // the star under the mouse, while hovering
  onChange: (rating: number | null) => void;
}) {
  const [text, setText] = useState(value?.toFixed(1) ?? "");

  // The rating changed some other way (the stars) → show it, unless it's what's
  // already typed (typing "4.3" sets the value to 4.3; don't rewrite "4.3" mid-edit)
  useEffect(() => {
    setText((current) =>
      Number(current) === value ? current : (value?.toFixed(1) ?? ""),
    );
  }, [value]);

  function commit(raw: string) {
    if (raw.trim() === "") return onChange(null);
    const n = Number(raw);
    if (Number.isFinite(n) && n >= 0.1 && n <= 5) onChange(roundRating(n));
  }

  return (
    <label className="flex items-baseline gap-1">
      <input
        type="number"
        inputMode="decimal"
        min={0.1}
        max={5}
        step={0.1}
        placeholder="–"
        // Hovering the stars previews here too; otherwise it's the real rating / what you typed
        value={preview ? preview.toFixed(1) : text}
        onChange={(e) => {
          setText(e.target.value);
          commit(e.target.value);
        }}
        // Leaving the box tidies it: "4" → "4.0", invalid → back to the saved rating
        onBlur={() => setText(value?.toFixed(1) ?? "")}
        onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
        aria-label="Exact rating, 0.1 to 5"
        className="input input-sm w-16 [appearance:textfield] text-center font-serif text-base font-semibold tabular-nums [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <span className="text-sm opacity-50">/ 5</span>
    </label>
  );
}

function label(value: number | null) {
  if (value == null) return "Not rated";
  if (value < 1.5) return "Not great";
  if (value < 2.5) return "Okay";
  if (value < 3.5) return "Good";
  if (value < 4.5) return "Great";
  return value >= 4.9 ? "Perfect" : "Excellent";
}
