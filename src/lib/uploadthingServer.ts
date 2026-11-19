import { UTApi } from "uploadthing/server";
import prisma from "@/lib/db";

// Server-side UploadThing client (reads UPLOADTHING_TOKEN). Never import this in a client component.
const utapi = new UTApi();

// A key is the last part of an UploadThing URL: https://<app>.ufs.sh/f/<key>
const KEY_PATTERN = /^[A-Za-z0-9_-]{8,200}$/;

// Validate a key sent by the browser (it came back from startUpload)
export function cleanFileKey(value: unknown): string | null {
  return typeof value === "string" && KEY_PATTERN.test(value) ? value : null;
}

// The file key for a stored photo: the saved key, or (for rows saved before we stored keys)
// parsed from the URL. Returns null for images we don't host, like Edamam's.
export function fileKeyOf(
  key: string | null,
  url: string | null,
): string | null {
  if (key) return key;
  if (!url) return null;
  try {
    const { hostname, pathname } = new URL(url);
    if (!hostname.endsWith(".ufs.sh") && hostname !== "utfs.io") return null;
    const match = pathname.match(/^\/f\/([^/]+)$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

// Is any remaining row still showing this file?
async function stillUsed(key: string) {
  const [entries, recipes] = await Promise.all([
    prisma.recipeEntry.count({
      where: {
        OR: [{ photoKey: key }, { photoUrl: { endsWith: `/f/${key}` } }],
      },
    }),
    prisma.recipe.count({
      where: { OR: [{ imageKey: key }, { image: { endsWith: `/f/${key}` } }] },
    }),
  ]);
  return entries + recipes > 0;
}

// Call AFTER deleting rows. Removes their files from UploadThing, but only files that
// no other row still uses. (Photo URLs are public, so someone could reference your file
// in their own row; this check means deleting their row can't delete your photo.)
// Never throws: the rows are already gone, so a failed cleanup is logged, not returned.
export async function deleteUnusedFiles(
  files: { key: string | null; url: string | null }[],
) {
  try {
    const keys = [
      ...new Set(
        files
          .map((f) => fileKeyOf(f.key, f.url))
          .filter((k): k is string => !!k),
      ),
    ];
    const unused: string[] = [];
    for (const key of keys) {
      if (!(await stillUsed(key))) unused.push(key);
    }
    if (unused.length > 0) await utapi.deleteFiles(unused);
  } catch (error) {
    console.error("UploadThing cleanup failed:", error);
  }
}
