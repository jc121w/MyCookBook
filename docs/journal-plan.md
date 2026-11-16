# MyCookBook → Cooking Journal: Plan

> Goal: turn the library into a personal cooking journal. Each recipe is a **book**.
> Opening a book shows **entries**, one for every time you cooked it, each with a
> date, notes and one photo. Search and custom recipes stay.

---

## Decisions (final)

| # | Decision | Choice |
|---|---|---|
| 1 | Who sees entries? | **Private.** Each user sees only their own recipes and entries |
| 2 | Recipes: shared or per-user? | **Per-user** (how it works today). Two users cooking the same Edamam recipe each have their own row |
| 3 | Photos per entry | **One** (`photoUrl`) |
| 4 | Photo storage | **UploadThing** (see Phase 6) |
| 5 | The "Save" button | **Replaced by "Log a cook"** |
| 6 | Existing data | Reset is optional. With per-user recipes, the migration only *adds* a table, so nothing conflicts |

---

## The big picture

```
Search result ──► "Log a cook" ──► make sure the book exists (upsert) ──► Entry form
Custom recipe ──► already a book ─────────────────────────────────────►  Entry form
                                                                             │
                 Photo ──► UploadThing ──► returns a URL ────────────────────┤
                                                                             ▼
Library (my books)   ◄── GET /api/library               POST /api/entries ──► Postgres
Book page (entries)  ◄── GET /api/library/[recipeId]
```

- **Recipe** = a book. **JournalEntry** = one page in it.
- "Book" is only the UI. In the database it stays `Recipe`. Name data after what it *is*.
- No classes needed. You'll write **functions** (components, route handlers, helpers), **types**, and call methods on the `prisma` **object**.

---

## Concepts

### 1. One-to-many relations

An analog app: each user has their own **Trails**, and each trail has many **HikeLogs**.

```prisma
model Trail {
  id         Int       @id @default(autoincrement())
  userId     String                                   // owner
  user       User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  externalId String?                                  // id from a trails API; null if user-made
  name       String
  logs       HikeLog[]                                // virtual: "all logs for this trail"

  @@unique([userId, externalId])                      // one copy of each API trail per user
}

model HikeLog {
  id        Int      @id @default(autoincrement())
  trailId   Int                                       // real column: which trail
  trail     Trail    @relation(fields: [trailId], references: [id], onDelete: Cascade)
  hikedOn   DateTime @db.Date                         // date only, no time
  notes     String?
  photoUrl  String?
  createdAt DateTime @default(now())

  @@index([trailId])
}
```

| Line | What it is |
|---|---|
| `trailId Int` | an actual column (a **foreign key**) that stores the trail's id |
| `trail Trail @relation(...)` | **virtual**: lets Prisma join to the Trail. Not a column |
| `logs HikeLog[]` | virtual, the reverse side: "every log that points at me" |
| `onDelete: Cascade` | deleting a trail also deletes its logs |
| `@@index([trailId])` | makes "all logs for trail X" fast |

**Why `HikeLog` has no `userId`:** the trail already belongs to a user, so the log's owner is
always `log.trail.userId`. Storing it twice means the two could disagree one day.

### 2. Reading related data: `include` and `_count`

```ts
// One trail with its logs, newest first
const trail = await prisma.trail.findFirst({
  where: { id: 5, userId },                                  // only if it's mine
  include: { logs: { orderBy: { hikedOn: "desc" } } },
});
// → { id: 5, name: "Mt Si", logs: [{ hikedOn, notes, photoUrl }, ...] }

// The shelf: all my trails, each with a log count
const trails = await prisma.trail.findMany({
  where: { userId },
  include: { _count: { select: { logs: true } } },
});
// → [{ id: 5, name: "Mt Si", _count: { logs: 12 } }, ...]
```

### 3. Ownership checks through a relation

A log has no `userId`, so filter through its trail:

```ts
// Delete log 9, but only if its trail is mine
const { count } = await prisma.hikeLog.deleteMany({
  where: { id: 9, trail: { userId } },
});
if (count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
```

**Creating** needs the same check. The client sends a `trailId`, and a malicious user could send
someone else's:

```ts
const trail = await prisma.trail.findFirst({ where: { id: body.trailId, userId } });
if (!trail) return NextResponse.json({ error: "Not found" }, { status: 404 });
// only now create the log
```

### 4. Types for query results that include relations

Prisma's `Trail` type doesn't include `logs`. Generate a type from the query's shape:

```ts
import { Prisma } from "@prisma/client";

export type TrailWithLogs = Prisma.TrailGetPayload<{ include: { logs: true } }>;
export type TrailWithCount = Prisma.TrailGetPayload<{
  include: { _count: { select: { logs: true } } };
}>;
```

These go in `src/app/types.ts`.

### 5. Gotcha: dates over the API

```ts
// Server: Prisma returns a Date object
log.hikedOn   // Date

// Client, after axios: JSON has no Date type
log.hikedOn   // "2026-11-15T00:00:00.000Z" (a string)
```

Convert when displaying, and **always pass `timeZone: "UTC"`**:

```ts
new Date(log.hikedOn).toLocaleDateString(undefined, { timeZone: "UTC" })   // "11/15/2026"
```

A `@db.Date` is stored as midnight UTC, which is the *previous evening* in US time zones.
Without `timeZone: "UTC"`, every date shows one day early.

`<input type="date">` gives you `"2026-11-15"`. On the server, `new Date("2026-11-15")` turns
it into midnight UTC, which matches.

### 6. How photo upload works

```
1. The user picks a photo (<input type="file"> or UploadThing's button)
2. The browser uploads the file DIRECTLY to UploadThing
3. UploadThing returns a URL: "https://....ufs.sh/f/abc.jpg"
4. Your form sends { cookedOn, notes, photoUrl } as normal JSON
5. Your API stores only the URL string in Postgres
```

- **Not in Postgres:** images are large and make the database slow and expensive.
- **Not in `/public`:** that folder is part of your deployed code. Files uploaded at runtime
  are lost on most hosts.
- **Directly from the browser:** phone photos are 3–8 MB, and hosts limit how big an API
  request can be (Vercel's limit is 4.5 MB).

---

## File structure

```
prisma/schema.prisma                   Recipe (gains an entries relation), JournalEntry (new)

src/app/
  library/page.tsx                     the shelf: my books
  library/[recipeId]/page.tsx          one book: recipe header + entries
  library/[recipeId]/new/page.tsx      new-entry form
  recipe/[id]/page.tsx                 (exists) add a "Log a cook" button
  api/library/route.ts                 GET my books · POST make sure a book exists (upsert)
  api/library/[recipeId]/route.ts      GET one book with its entries
  api/entries/route.ts                 POST a new entry
  api/entries/[id]/route.ts            PATCH / DELETE an entry
  api/uploadthing/core.ts + route.ts   upload setup (Phase 6)
  types.ts                             BookWithCount, BookWithEntries, ...

src/components/journal/
  BookCard.tsx                         one book on the shelf
  EntryCard.tsx                        one journal entry
  EntryForm.tsx                        date + notes + photo (react-hook-form)
  LogCookButton.tsx                    make sure the book exists, then go to the form
```

| Existing file | What happens to it |
|---|---|
| `api/route.ts` (GET list, POST upsert) | moves to `api/library/route.ts`. The upsert becomes "make sure the book exists" |
| `api/saved/[id]` (already looks up by DB id) | moves to `api/library/[recipeId]` and adds `include` for entries |
| `api/recipes/custom` | stays. Creating a custom recipe creates an empty book |
| `SaveButton` | replaced by `LogCookButton` |
| `RecipeCard`, `RecipeDetail` | reused: one for books on the shelf, one as the book page header |

---

## Build order

Get the simplest version working end to end first (log an entry, then see it). Leave photos,
the hardest external piece, until later.

| Phase | Build | Done when |
|---|---|---|
| 0 | Finish the `RecipeDetail` refactor | the search detail page loads, with a loading state and no `/api/saved` call |
| 1 | Schema: add `JournalEntry` and its relation on `Recipe`; migrate | Prisma Studio shows the table, and you can add an entry by hand |
| 2 | API routes (see the file structure) | the browser or curl returns JSON; 401 when signed out; 400 for bad input; 404 for someone else's recipe |
| 3 | The shelf | your books appear, with entry counts |
| 4 | The book page | entries appear newest first, with dates shown correctly |
| 5 | Entry form + "Log a cook" | logging from search lands in the book, and the list refreshes |
| 6 | Photos with UploadThing | the photo appears on the entry |
| 7 | Edit and delete entries; empty states | an empty book says "No entries yet"; deleting works |
| 8 | *(optional)* "In your library · 3 cooks" badge on the search detail page | a separate `useQuery` looks up the book by `userId_edamamId` and returns `{ id, _count }` or `null`; the page still loads when it's `null` |

### Phase notes

**Phase 1:** an entry needs: which recipe it belongs to, the date cooked, optional notes, an optional
photo URL, and timestamps. Use the `HikeLog` example as your guide. Send me the schema for
review before migrating.

**Phase 2: "Log a cook" for an Edamam recipe:**
```
click → POST /api/library { Edamam recipe data }
      → upsert by userId_edamamId (your existing save logic) → returns { id }
      → router.push(`/library/${id}/new`)
```
After that, the entry form always has a `recipeId`.

**Phase 5:** after a successful save, `queryClient.invalidateQueries({ queryKey: [...] })`
refetches the book so the new entry appears, and `router.push` takes you back to it.

**Phase 3: a book shape with plain Tailwind:**
```tsx
<div className="bg-base-200 border-primary aspect-[2/3] rounded-r-lg border-l-8 shadow-md">
  {/* cover image, title, "12 entries" */}
</div>
```
`border-l-8` draws the spine, and `aspect-[2/3]` gives it a book's proportions.

**Phase 6: UploadThing:**
- Install `uploadthing` and `@uploadthing/react`, and add your token to `.env`.
- The upload route must check the BetterAuth session, so only signed-in users can upload.
- Use their upload button or dropzone in `EntryForm`. When the upload finishes, it gives you the
  file URL. Put that URL in the form's `photoUrl` field.
- If you switch to `next/image`, add the UploadThing host to `remotePatterns` in `next.config.mjs`.
- Follow the official "Next.js App Router" setup guide for the exact code.
