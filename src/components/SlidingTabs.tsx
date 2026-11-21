"use client";

import { motion } from "motion/react";
import { useLayoutEffect, useRef, useState } from "react";

// A row of tabs with one pill that slides to the selected tab.
//   filled: a dark pill with light text (the book's Cover / Recipe / Journal)
//   soft:   a white pill on cream (the shelf's Dish / Cuisine / Meal)
//
// How the slide works: every tab's spot inside the bar is measured once (and again only
// if a tab changes size). Selecting a tab just picks its spot, so the pill starts moving
// on the very next frame. offsetLeft/offsetWidth are layout sizes, unaffected by any
// scale animation on a parent (like the book growing open). No layoutId, so the pill
// never flies in from somewhere else; it's an ordinary part of the bar.
export function SlidingTabs<T extends string | number>({
  options,
  value,
  onChange,
  label,
  variant = "filled",
  className = "",
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  label: string; // for screen readers: "Pages", "Sort shelves by"
  variant?: "filled" | "soft";
  className?: string;
}) {
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const [spots, setSpots] = useState<{ x: number; width: number }[]>([]);

  useLayoutEffect(() => {
    const measure = () =>
      setSpots(
        tabs.current.map((t) => ({
          x: t?.offsetLeft ?? 0,
          width: t?.offsetWidth ?? 0,
        })),
      );
    measure();
    const observer = new ResizeObserver(measure);
    tabs.current.forEach((t) => t && observer.observe(t));
    return () => observer.disconnect();
  }, [options.length]);

  const selected = options.findIndex((o) => o.value === value);
  const pill = spots[selected];
  const filled = variant === "filled";

  return (
    <div
      role="tablist"
      aria-label={label}
      className={`bg-base-200/70 relative flex gap-1 rounded-full p-1 ${className}`}
    >
      {pill && (
        <motion.span
          aria-hidden
          className={`absolute top-1 bottom-1 left-0 rounded-full ${
            filled ? "bg-primary shadow-sm" : "bg-base-100 shadow"
          }`}
          initial={false} // first placement: no animation
          animate={{ x: pill.x, width: pill.width }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        />
      )}
      {options.map((option, i) => {
        const active = i === selected;
        return (
          <button
            key={option.value}
            ref={(el) => {
              tabs.current[i] = el;
            }}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={`relative rounded-full px-3 py-1 text-sm transition-colors ${
              active
                ? filled
                  ? "text-primary-content"
                  : "text-base-content"
                : "opacity-60 hover:opacity-100"
            } ${filled ? "font-serif" : ""}`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
