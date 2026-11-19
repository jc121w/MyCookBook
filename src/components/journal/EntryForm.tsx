"use client";

import type { RecipeEntry } from "@prisma/client";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { ImagePlus, X } from "lucide-react";
import { useEffect, useState, type DragEvent } from "react";
import { useForm } from "react-hook-form";
import { useUploadThing } from "@/lib/uploadthing";

const MAX_PHOTO_MB = 8; // keep in sync with maxFileSize in api/uploadthing/core.ts

type EntryFormValues = {
  cookedOn: string; // "2026-11-15"
  notes: string;
};

type EntryFormProps = {
  recipeId: number;
  onCancel: () => void;
  onSaved: (entry: RecipeEntry) => void;
};

// Today as "YYYY-MM-DD" in the user's own time zone.
// ("en-CA" happens to format dates as YYYY-MM-DD, which is what <input type="date"> wants.)
const today = () => new Date().toLocaleDateString("en-CA");

export function EntryForm({ recipeId, onCancel, onSaved }: EntryFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EntryFormValues>({
    defaultValues: { cookedOn: today(), notes: "" },
  });

  // The photo lives outside react-hook-form: it's a File object, not text.
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const preview = usePreviewUrl(photo);

  const { startUpload } = useUploadThing("entryPhoto");

  const save = useMutation({
    mutationFn: async (values: EntryFormValues) => {
      // 1. Upload the photo straight to UploadThing (not through our API)
      let photoUrl: string | null = null;
      if (photo) {
        const uploaded = await startUpload([photo]);
        photoUrl = uploaded?.[0]?.ufsUrl ?? null;
        if (!photoUrl) throw new Error("The photo didn't upload. Try again.");
      }
      // 2. Save the entry with the photo's URL
      const { data } = await axios.post<RecipeEntry>("/api/entries", {
        recipeId,
        cookedOn: values.cookedOn,
        notes: values.notes,
        photoUrl,
      });
      return data;
    },
    onSuccess: onSaved,
  });

  function pickPhoto(file: File | undefined) {
    setPhotoError(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) return setPhotoError("That file isn't an image.");
    if (file.size > MAX_PHOTO_MB * 1024 * 1024)
      return setPhotoError(`Photos can be up to ${MAX_PHOTO_MB} MB.`);
    setPhoto(file);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    pickPhoto(e.dataTransfer.files[0]);
  }

  const busyLabel = photo ? "Uploading photo…" : "Saving…";

  return (
    <form
      onSubmit={handleSubmit((values) => save.mutate(values))}
      className="flex h-full flex-col"
    >
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 pt-2 pb-4">
        <div>
          <p className="text-xs font-semibold tracking-widest uppercase opacity-60">New entry</p>
          <div className="divider my-0" />
        </div>

        {/* ── Date ── */}
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Date cooked</span>
          <input
            type="date"
            max={today()}
            className="input input-bordered w-full"
            {...register("cookedOn", {
              required: "Pick the day you cooked it",
              validate: (v) => v <= today() || "That date is in the future",
            })}
          />
          {errors.cookedOn && <span className="text-error text-xs">{errors.cookedOn.message}</span>}
        </label>

        {/* ── Photo ── */}
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">
            Photo <span className="font-normal opacity-50">(optional)</span>
          </span>

          {preview ? (
            <div className="relative overflow-hidden rounded-lg">
              <img src={preview} alt="Selected photo" className="aspect-[4/3] w-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 flex justify-end gap-2 bg-linear-to-t from-black/60 to-transparent p-2">
                <label className="btn btn-sm">
                  Change
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => pickPhoto(e.target.files?.[0])}
                  />
                </label>
                <button
                  type="button"
                  className="btn btn-sm btn-circle"
                  onClick={() => setPhoto(null)}
                  aria-label="Remove photo"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            // The whole box is a <label>, so clicking anywhere opens the file picker.
            <label
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
              className="border-base-300 hover:border-primary hover:bg-base-200/60 flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed text-center transition-colors"
            >
              <ImagePlus className="h-9 w-9 opacity-40" strokeWidth={1.5} />
              <span className="text-sm font-medium">Add a photo</span>
              <span className="text-xs opacity-50">Tap to choose or drop here · up to {MAX_PHOTO_MB} MB</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => pickPhoto(e.target.files?.[0])}
              />
            </label>
          )}
          {photoError && <span className="text-error text-xs">{photoError}</span>}
        </div>

        {/* ── Notes ── */}
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">
            Notes <span className="font-normal opacity-50">(optional)</span>
          </span>
          <textarea
            rows={5}
            placeholder="What did you change? How did it turn out?"
            className="textarea textarea-bordered w-full font-serif text-base leading-relaxed"
            {...register("notes", { maxLength: { value: 5000, message: "Keep it under 5,000 characters" } })}
          />
          {errors.notes && <span className="text-error text-xs">{errors.notes.message}</span>}
        </label>

        {save.error && (
          <p className="text-error text-sm">
            {axios.isAxiosError(save.error)
              ? (save.error.response?.data?.error ?? "Couldn't save the entry.")
              : save.error.message}
          </p>
        )}
      </div>

      {/* ── Actions (same spot as the page controls) ── */}
      <div className="border-base-300 flex items-center justify-end gap-2 border-t p-3">
        <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={save.isPending}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={save.isPending}>
          {save.isPending ? (
            <>
              <span className="loading loading-spinner loading-sm" /> {busyLabel}
            </>
          ) : (
            "Save entry"
          )}
        </button>
      </div>
    </form>
  );
}

// A temporary browser URL for previewing a picked File, released when it changes.
function usePreviewUrl(file: File | null) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!file) return setUrl(null);
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl); // free memory
  }, [file]);
  return url;
}
