# Recipe search

MyCookBook is a Next.js app where users search recipes, open details, and save them to a personal library. Auth is BetterAuth; saved recipes live in Postgres. Search data comes from the Edamam Recipe API.

This code is the search path.

## What the attached code does

The search page (`search/page.tsx`) puts the query in the URL (`?search=`). TanStack Query then calls `fetchRecipe` in `lib/edamam.ts`, which hits `GET /api/recipes?q=...`.

That route (`api/recipes/route.ts`) is a server proxy. It adds `EDAMAM_APP_ID` and `EDAMAM_APP_KEY` and forwards the request to Edamam so keys never go to the browser. A missing query returns 400; Edamam errors are passed back as JSON.

Results go to `ResultGrid`, which handles empty, loading, error, and hit states, then renders a `RecipeCard` per recipe. The card shows image, calories, time, and cuisine. Clicking it stores the recipe in `localStorage` and opens `/recipe/[id]`.

`api/recipes/[id]/route.ts` fetches one recipe by Edamam id the same way. `types.ts` is the Edamam recipe/search shape. `lib/recipe.ts` pulls the id from Edamam’s URI (`#recipe_...`).
