import { generateReactHelpers } from "@uploadthing/react";
import type { AppFileRouter } from "@/app/api/uploadthing/core";

// Typed hook: useUploadThing("entryPhoto") autocompletes and type-checks the endpoint name.
export const { useUploadThing } = generateReactHelpers<AppFileRouter>();
