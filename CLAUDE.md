# MyCookBook — Claude Code Configuration

## Project Overview
A recipe finder and meal plan builder. Users can search recipes, view details, and save them to a personal library.

## Tech Stack
- **Framework**: Next.js (App Router) with TypeScript
- **Styling**: Tailwind CSS + DaisyUI + `@tailwindcss/typography`
- **Auth**: BetterAuth (`src/lib/auth.ts`) with email/password, Google, and GitHub providers
- **Database**: PostgreSQL via Prisma (`src/lib/db.ts`)
- **Data Fetching**: TanStack Query (`@tanstack/react-query`)
- **Recipe API**: Edamam (`src/lib/edamam.ts`)
- **Forms**: react-hook-form

## Common Commands
```bash
npm run dev          # Start dev server
npm run build        # Generate Prisma client + build
npm run lint         # ESLint
npm run prisma:generate  # Regenerate Prisma client
```

## Project Structure
```
src/
  app/               # Next.js App Router pages
    (auth)/          # Sign-in / Sign-up routes
    recipe/[id]/     # Recipe detail page
    search/          # Recipe search page
    library/         # User's saved recipes
    profile/         # User profile page
    api/             # API routes (auth, recipes)
  components/
    bars/            # Navbar, SideBar
    buttons/         # SignOutButton, etc.
    form/            # SignIn, SignUp, RecipeForm
    profile/         # ProfileCard
    recipes/         # RecipeCard, LibRecipeCard
    providers/       # Providers, SessionProvider
  lib/
    auth.ts          # BetterAuth config
    db.ts            # Prisma singleton
    edamam.ts        # Edamam API client
    actions/         # Server actions
  app/types.ts       # Shared TypeScript types (Recipe, EdamamSearchResponse, etc.)
  constants/
    navigation.ts    # Nav link definitions
```

## Conventions
- Use the `src/app/types.ts` file for shared types; add new types there
- Prisma client is a singleton imported from `src/lib/db.ts`
- Auth is handled via BetterAuth; session access goes through `src/lib/auth.ts`
- Prefer Tailwind utility classes over custom CSS
- Client components use `"use client"` directive at the top
- API routes live under `src/app/api/`
