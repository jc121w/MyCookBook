"use client";

import { useMutation } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useState } from "react";

type ConfirmDeleteProps = {
  label: string; // the quiet link, e.g. "Delete entry"
  question: string; // asked before deleting, e.g. "Delete this entry?"
  onConfirm: () => Promise<unknown>; // does the delete (and any refetching)
};

// A quiet delete link that asks inline before doing anything destructive.
// Two clicks to delete, nothing modal, and Cancel is always right there.
export function ConfirmDelete({
  label,
  question,
  onConfirm,
}: ConfirmDeleteProps) {
  const [asking, setAsking] = useState(false);
  const remove = useMutation({ mutationFn: onConfirm });

  if (!asking) {
    return (
      <button
        type="button"
        className="btn btn-ghost btn-xs gap-1 font-normal opacity-50 hover:opacity-100"
        onClick={() => setAsking(true)}
      >
        <Trash2 className="h-3.5 w-3.5" /> {label}
      </button>
    );
  }

  return (
    <div
      role="alert"
      className="bg-error/10 flex flex-wrap items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm"
    >
      <span>{question}</span>
      <div className="flex gap-1">
        <button
          type="button"
          className="btn btn-error btn-xs"
          disabled={remove.isPending}
          onClick={() => remove.mutate()}
        >
          {remove.isPending ? (
            <span className="loading loading-spinner loading-xs" />
          ) : (
            "Delete"
          )}
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-xs"
          disabled={remove.isPending}
          onClick={() => {
            setAsking(false);
            remove.reset();
          }}
        >
          Cancel
        </button>
      </div>
      {remove.isError && (
        <p className="text-error w-full text-center text-xs">
          Couldn&apos;t delete. Try again.
        </p>
      )}
    </div>
  );
}
