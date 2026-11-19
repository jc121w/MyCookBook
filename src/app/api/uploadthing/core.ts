import { auth } from "@/lib/auth";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

const f = createUploadthing();

// Each key is an "endpoint" the client can upload to.
export const fileRouter = {
  entryPhoto: f({ image: { maxFileSize: "8MB", maxFileCount: 1 } })
    // Runs on YOUR server before the upload starts. Throwing here rejects the upload,
    // so only signed-in users can store files on your UploadThing account.
    .middleware(async ({ req }) => {
      const session = await auth.api.getSession({ headers: req.headers });
      if (!session) throw new UploadThingError("Unauthorized");
      return { userId: session.user.id }; // passed to onUploadComplete as `metadata`
    })
    // Runs after the file is stored. The client gets the URL back; we save it with the entry.
    .onUploadComplete(async ({ metadata }) => {
      return { uploadedBy: metadata.userId };
    }),
} satisfies FileRouter;

export type AppFileRouter = typeof fileRouter;
