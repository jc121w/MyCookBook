"use client";

import { useSyncExternalStore } from "react";

// true on small phones (under 480px wide). For things CSS can't change, like an input's
// placeholder text. Renders as "not narrow" on the server, then updates in the browser.
const QUERY = "(max-width: 479px)";

export function useNarrow() {
  return useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(QUERY);
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    },
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}
