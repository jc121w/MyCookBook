"use client";

import { ImagePlus, X } from "lucide-react";
import { useEffect, useState, type DragEvent } from "react";

type PhotoPickerProps = {
  file: File | null;
  onChange: (file: File | null) => void;
  maxMb: number; // keep in sync with maxFileSize in api/uploadthing/core.ts
  aspect?: string; // Tailwind aspect class for the box
};

// Click or drop to choose a photo; shows a preview with Change / Remove.
// Only picks the file — the parent form uploads it on submit.
export function PhotoPicker({
  file,
  onChange,
  maxMb,
  aspect = "aspect-[4/3]",
}: PhotoPickerProps) {
  const [error, setError] = useState<string | null>(null);
  const preview = usePreviewUrl(file);

  function pick(next: File | undefined) {
    setError(null);
    if (!next) return;
    if (!next.type.startsWith("image/"))
      return setError("That file isn't an image.");
    if (next.size > maxMb * 1024 * 1024)
      return setError(`Photos can be up to ${maxMb} MB.`);
    onChange(next);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    pick(e.dataTransfer.files[0]);
  }

  const fileInput = (
    <input
      type="file"
      accept="image/*"
      className="hidden"
      onChange={(e) => {
        pick(e.target.files?.[0]);
        e.target.value = ""; // allow re-picking the same file
      }}
    />
  );

  return (
    <div className="flex flex-col gap-1.5">
      {preview ? (
        <div className="relative overflow-hidden rounded-lg">
          <img
            src={preview}
            alt="Selected photo"
            className={`${aspect} w-full object-cover`}
          />
          <div className="absolute inset-x-0 bottom-0 flex justify-end gap-2 bg-linear-to-t from-black/60 to-transparent p-2">
            <label className="btn btn-sm">
              Change
              {fileInput}
            </label>
            <button
              type="button"
              className="btn btn-sm btn-circle"
              onClick={() => onChange(null)}
              aria-label="Remove photo"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        // The whole box is a <label>, so clicking anywhere opens the file picker
        <label
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          className={`${aspect} border-base-300 hover:border-primary hover:bg-base-200/60 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed text-center transition-colors`}
        >
          <ImagePlus className="h-9 w-9 opacity-40" strokeWidth={1.5} />
          <span className="text-sm font-medium">Add a photo</span>
          <span className="text-xs opacity-50">
            Tap to choose or drop here · up to {maxMb} MB
          </span>
          {fileInput}
        </label>
      )}
      {error && <span className="text-error text-xs">{error}</span>}
    </div>
  );
}

// A temporary browser URL for previewing a picked File, released when it changes
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
