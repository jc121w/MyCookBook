import { auth } from "@/lib/auth";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

const f = createUploadthing();

// Runs on YOUR server before an upload starts. Throwing rejects the upload,
// so only signed-in users can store files on your UploadThing account.
async function requireUser({ req }: { req: Request }) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) throw new UploadThingError("Unauthorized");
  return { userId: session.user.id }; // passed to onUploadComplete as `metadata`
}

// Each key is an "endpoint" the client can upload to.
export const fileRouter = {
  // A photo on a journal entry
  entryPhoto: f({ image: { maxFileSize: "8MB", maxFileCount: 1 } })
    .middleware(requireUser)
    .onUploadComplete(async ({ metadata }) => ({ uploadedBy: metadata.userId })),

  // The cover photo of a recipe the user created
  recipePhoto: f({ image: { maxFileSize: "8MB", maxFileCount: 1 } })
    .middleware(requireUser)
    .onUploadComplete(async ({ metadata }) => ({ uploadedBy: metadata.userId })),
} satisfies FileRouter;

export type AppFileRouter = typeof fileRouter;
