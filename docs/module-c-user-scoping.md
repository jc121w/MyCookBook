# Module C — Scope Saved Recipes to the Logged-In User

> Goal: right now every saved recipe is shared — the DB doesn't know *who* saved
> what. This module makes each recipe belong to a user, so the library shows
> only *your* recipes. Along the way you relearn **BetterAuth sessions on the
> server**, **foreign keys / relations**, and **composite unique constraints**.
>
> Work top to bottom. Each step has: the concept, an example, what to write
> (with blanks you must fill), and a self-check. Don't skip the "Predict" boxes —
> saying the answer out loud *before* you run it is the actual learning.

---

## The one auth idea to hold in your head

When a user signs in, BetterAuth stores a **session cookie** in their browser.
That cookie rides along on every request automatically. On the **server** you
turn that cookie into a user with:

```ts
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const session = await auth.api.getSession({ headers: await headers() });
// logged in  -> session.user.id  (a string; the User table's primary key)
// logged out -> session === null
```

Your app already does this in `src/app/layout.tsx` (line ~26). Everything in
this module is just: **get the user id, then use it to tag saves and filter reads.**

---

## Step C0 — Remove debug scaffolding (30 sec)

In `src/app/api/route.ts`, the POST `catch` still leaks internals to the client:

```ts
// REMOVE the `detail` field — keep console.error
return NextResponse.json(
  { message: "Could Not Add Recipe", detail: String(error) }, // <- delete detail
  { status: 500 },
);
```

Leave `console.error(...)` (server logs are good); delete `detail: String(error)`.
**Lesson:** debug output that exposes error internals should never ship.

---

## Step C1 — Reshape the schema for ownership

### Concepts (know the *why*)

- **`@id @default(autoincrement())`** — the database generates a unique integer
  id for each row. You stop supplying the id yourself on save.
- **`edamamId String`** — the Edamam recipe id (was the primary key) demoted to
  an ordinary field. Why demote it? Because it's shared across users — it can't
  be a *unique* primary key once two people can save the same recipe.
- **Relation / foreign key** —
  `user User @relation(fields: [userId], references: [id], onDelete: Cascade)`
  means "`userId` here points at `id` on the `User` table." `onDelete: Cascade`
  = delete the user, their recipes go too. (Same pattern as `Session`/`Account`
  already in your schema.)
- **`@@unique([userId, edamamId])`** — a **composite unique constraint**: the
  *combination* must be unique. One user can't save the same recipe twice; two
  different users can each have their own copy.
- **`@@index([userId])`** — makes "all recipes for this user" queries fast (the
  library's exact query).

### Do this — replace `model Recipe` with:

```prisma
model Recipe {
  id              Int      @id @default(autoincrement())
  edamamId        String
  userId          String
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  label           String
  image           String
  source          String
  url             String
  yield           Int
  calories        Float
  totalTime       Int
  dietLabels      String[]
  healthLabels    String[]
  ingredientLines String[]
  cuisineType     String[]
  mealType        String[]
  dishType        String[]
  totalNutrients  Json
  raw             Json?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([userId, edamamId])
  @@index([userId])
}
```

### And add the reverse relation to `model User` (one line inside it):

```prisma
  recipes  Recipe[]
```

Prisma relations are two-sided: `Recipe` points to `User` via `userId`; `User`
points back via `recipes`. Both sides must be declared.

### Migrate (mind the gotcha you already hit)

The table still has the 1 old `Frog's Eye Salad` row with no `userId`. Adding a
**required** column to a table that already has rows fails ("can't add required
column to existing rows"). So:

1. `npx prisma studio` → open `Recipe` → **delete the existing row** → close (Ctrl-C).
2. `npx prisma migrate dev --name add_user_ownership`  (approve the data-loss warning)
3. **Restart the dev server** (Ctrl-C the `npm run dev`, run it again) — the
   running process caches the old Prisma client in memory.
4. In your editor: `Cmd+Shift+P` → "TypeScript: Restart TS Server".

### ✅ Predict before you migrate
1. Why do you now pass `edamamId` and `userId` when saving, but NOT `id`?
2. With `@@unique([userId, edamamId])`: what happens if the **same** user saves
   the **same** recipe twice? What's different if a **different** user saves it?

---

## Step C2 — POST: save scoped to the current user

### Concept
Reading the session in an API route is the same call as the layout. If there's
no session, the request isn't allowed to write — return **401 Unauthorized**.
Then `upsert` using the **composite unique** to find "this user's copy of this recipe."

### Do this — in `src/app/api/route.ts`, update the imports and `POST`:

```ts
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
// (keep existing: prisma, extractRecipeId, NextResponse)

export async function POST(req: Request) {
  try {
    // 1. Who is calling?
    const session = await auth.api.getSession({ headers: await headers() });
    if (____) {                                   // BLANK: not logged in?
      return NextResponse.json({ error: "Not authenticated" }, { status: ___ }); // BLANK: which code?
    }

    const body = await req.json();
    const edamamId = extractRecipeId(body.uri);
    const userId = session.user.id;

    // display fields only — NOT id / userId / edamamId (those are set explicitly)
    const recipeData = {
      label: body.label,
      image: body.image,
      source: body.source,
      url: body.url,
      yield: body.yield,
      calories: body.calories,
      totalTime: body.totalTime,
      dietLabels: body.dietLabels,
      healthLabels: body.healthLabels,
      ingredientLines: body.ingredientLines,
      cuisineType: body.cuisineType,
      mealType: body.mealType,
      dishType: body.dishType,
      totalNutrients: body.totalNutrients,
      raw: body,
    };

    const saved = await prisma.recipe.upsert({
      where:  { userId_edamamId: { userId, edamamId } },  // the composite unique
      update: recipeData,
      create: { userId, edamamId, ...recipeData },        // no id — DB generates it
    });

    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    console.error("POST /api failed:", error);
    return NextResponse.json({ message: "Could Not Add Recipe" }, { status: 500 });
  }
}
```

Note `where: { userId_edamamId: { ... } }` — Prisma names a composite-unique
selector by joining the field names with `_`. That's how you query by a
two-column uniqueness rule.

### ✅ Predict
1. If a logged-out user clicks Save, which line stops them, and what status does
   the browser get back?
2. Why is `id` absent from the `create` block now (compare to before C1)?

---

## Step C3 — GET: return only the current user's recipes

### Do this — update the `GET` in the same file:

```ts
export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const recipes = await prisma.recipe.findMany({
      where: { ____ },        // BLANK: filter to session.user.id
    });
    return NextResponse.json(recipes, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Could Not Fetch Recipes" }, { status: 500 });
  }
}
```

**Key idea:** before, `findMany()` returned *everyone's* recipes. Adding
`where: { userId: session.user.id }` is what makes the library *personal*. The
`@@index([userId])` you added makes this filter fast.

### ✅ Predict
1. Two users each saved 3 recipes (6 rows total). When user A loads the library,
   how many come back, and why?

---

## Step C4 — Test end-to-end (while signed in)

1. Make sure you're **signed in** (the app has sign-in at `/sign-in`).
2. Search a recipe → click **Save**. Should succeed (201).
3. Open `/library`. Your saved recipe should appear.
4. Verify in the DB directly:

```bash
node -e "const{PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.recipe.findMany().then(r=>{r.forEach(x=>console.log(x.id,x.userId,x.label));return p.\$disconnect()})"
```

Each row should now show an integer `id`, a `userId`, and the label. **Success =
`userId` is populated** — the recipe is owned.

5. (Optional) Sign out and try to Save — you should get a 401 and no row added.

### Note on the library display
The library page still reads DB rows and renders `elem.raw as unknown as Recipe`
through `RecipeCard` — that keeps working, because you still store `raw`. No
change needed there. (Later cleanup: give `RecipeCard` an explicit `id` prop so
it stops depending on the Edamam `.uri` shape.)

---

## 🎓 Final recall quiz (do this with the code CLOSED)

Answer in your own words — this is the real test:

1. **Sessions:** A request comes into your POST route. Explain the full path
   from "the user's browser has a cookie" to "I have `session.user.id` on the
   server." What produces the cookie, and what reads it?
2. **Routing:** Why does `axios.post("/api")` end up in `src/app/api/route.ts`'s
   `POST` function specifically — not its `GET`, and not some other file?
3. **Status codes:** You return `401` for logged-out, `201` for a created
   recipe, `404` for a missing one, `500` on a crash. Say what each means and
   why it belongs where it does.
4. **Schema/migrations:** Why couldn't you add the required `userId` column while
   the old row still existed? Name two ways to resolve it.
5. **Data modeling:** Why did the primary key have to stop being the Edamam id
   once recipes became user-owned? What does `@@unique([userId, edamamId])` buy
   you?
6. **Prisma client gotcha:** You change the schema and migrate, but the running
   app still errors with the old types. What two things must you restart, and why?
7. **Two shapes:** There are two `Recipe` types in this app. Where does each live,
   which fields distinguish them (`uri` vs `id`/`raw`), and why does the library
   page import *both*?
8. **Query vs mutation:** Why is *saving* a recipe a `useMutation` and *loading*
   the library a `useQuery`? What triggers each?

If you can answer all 8 without looking, you've genuinely relearned this stack.

---

## Quick reference — gotchas you learned this project
- After `prisma migrate` / `prisma generate`: **restart the dev server** (stale
  client in memory) **and** the editor's TS server (stale types on disk).
- Can't add a **required** column to a table that already has rows — clear the
  rows, or add it nullable + backfill + make required.
- API routes return **data (JSON)**; pages return **HTML**. Same URL system,
  different file (`route.ts` vs `page.tsx`).
- HTTP status is the **2nd argument** to `NextResponse.json(body, { status })`,
  never a field inside the body.
- `id` from a dynamic route (`[id]`) is always a **string** (URLs are text).
