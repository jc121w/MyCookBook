import axios from "axios";
import type { BookWithCount } from "@/app/types";

// The user's shelf. One shared query definition, so the library page and search
// share the same cache: adding from search updates the shelf, and vice versa.
export const libraryQuery = {
  queryKey: ["recipes"],
  queryFn: async () => (await axios.get<BookWithCount[]>("/api/library")).data,
  retry: false, // a 401 (signed out) won't succeed on retry
} as const;
