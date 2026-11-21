"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Plus, X } from "lucide-react";
import { useId, useState } from "react";
import type { BookWithCount } from "@/app/types";
import { libraryQuery } from "@/lib/library";
import { allTags, tagsOf } from "@/lib/shelf";

// Your own labels on a book ("Weeknight", "Holidays"), shown on its cover.
// Tap × to remove one, "Tag" to add one (it suggests tags you've used on other books).
// Saved with PUT /api/library/:id/tags; the shelf updates instantly (optimistic),
// and goes back if the save fails.
export function BookTags({ book }: { book: BookWithCount }) {
  const tags = tagsOf(book);
  const queryClient = useQueryClient();
  const shelf = useQuery(libraryQuery);
  const suggestions = allTags(shelf.data ?? []).filter(
    (t) => !tags.some((mine) => mine.toLowerCase() === t.toLowerCase()),
  );
  const listId = useId();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");

  const save = useMutation({
    mutationFn: (tags: string[]) =>
      axios.put(`/api/library/${book.id}/tags`, { tags }),
    // Show the change right away…
    onMutate: async (next) => {
      await queryClient.cancelQueries({ queryKey: libraryQuery.queryKey });
      const before = queryClient.getQueryData<BookWithCount[]>(
        libraryQuery.queryKey,
      );
      queryClient.setQueryData<BookWithCount[]>(libraryQuery.queryKey, (old) =>
        old?.map((b) => (b.id === book.id ? { ...b, tags: next } : b)),
      );
      return { before };
    },
    // …put it back if the server said no
    onError: (_err, _tags, context) => {
      if (context?.before)
        queryClient.setQueryData(libraryQuery.queryKey, context.before);
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: libraryQuery.queryKey }),
  });

  function add() {
    const tag = draft.trim().replace(/\s+/g, " ").slice(0, 30);
    setDraft("");
    setAdding(false);
    if (!tag || tags.some((t) => t.toLowerCase() === tag.toLowerCase())) return;
    save.mutate([...tags, tag]);
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5">
      {tags.map((tag) => (
        <span
          key={tag}
          className="bg-primary/10 text-base-content/80 inline-flex items-center gap-0.5 rounded-full py-0.5 pr-1 pl-2.5 text-xs"
        >
          {tag}
          <button
            type="button"
            onClick={() => save.mutate(tags.filter((t) => t !== tag))}
            aria-label={`Remove tag ${tag}`}
            className="hover:bg-base-content/10 grid h-5 w-5 place-items-center rounded-full opacity-60 hover:opacity-100"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}

      {adding ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            add();
          }}
        >
          <input
            autoFocus
            list={listId}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={add}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.stopPropagation(); // don't also close the book
                setDraft("");
                setAdding(false);
              }
            }}
            maxLength={30}
            placeholder="e.g. Weeknight"
            aria-label="New tag"
            className="input input-xs w-32 rounded-full"
          />
          <datalist id={listId}>
            {suggestions.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </form>
      ) : (
        tags.length < 12 && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="border-base-content/25 hover:border-primary inline-flex items-center gap-0.5 rounded-full border border-dashed px-2.5 py-0.5 text-xs opacity-70 hover:opacity-100"
          >
            <Plus className="h-3 w-3" /> Tag
          </button>
        )
      )}

      {save.isError && (
        <p className="text-error w-full text-center text-xs">
          Couldn&apos;t save tags. Try again.
        </p>
      )}
    </div>
  );
}
