# MyCookBook — Claude Code Configuration

## Project Overview
A recipe finder and meal plan builder. Users can search recipes, view details, and save them to a personal library.

## Conventions
- Use the `src/app/types.ts` file for shared types; add new types there
- Prisma client is a singleton imported from `src/lib/db.ts`
- Auth is handled via BetterAuth; session access goes through `src/lib/auth.ts`
- Prefer Tailwind utility classes over custom CSS
- Client components use `"use client"` directive at the top
- API routes live under `src/app/api/`
