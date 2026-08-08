# 🍳 [MyCookBook]

> A full-stack web app for building recipes and designing weekly meal plans.

<!-- Replace the tagline with your own one-liner: exactly what the app does, in one sentence. -->

![License](https://img.shields.io/badge/license-MIT-blue)

---

## 📖 Overview

A 2–4 sentence description. What problem does it solve, and for whom?
intro to cooking, knife advice, cheap nutricious, an app that helps teach you the cooking fundamentals and and how to create a healthy and sustainable meal plan and recipe repetoir to fit your nnutritional goals, beginner friendly

Example: "Home cooks juggle scattered recipes and struggle to plan balanced
weeks of meals. [Project Name] lets users build a personal recipe library, then
drag those recipes into a weekly planner that auto-generates a shopping list."

Lead with the *why* — it's what makes a reader care.

## ✨ Features

- 🥗 **Recipe builder** — create, edit, and tag recipes with ingredients, steps, and nutrition
- 🗓️ **Meal plan designer** — drag recipes into a weekly calendar
- 🛒 **Auto shopping list** — generated from the ingredients in your plan
- 🔍 **Search & filters** — filter by tag, prep time, dietary needs
- 👤 **Accounts & auth** — sign up / log in to save personal recipes and plans
- <!-- Add / trim to match what you've actually built -->

## 🖼️ Demo & Screenshots

<!-- For a visual app, this is one of the highest-value sections.
     A live demo link + 1–3 screenshots or a short GIF beats paragraphs of text. -->

🔗 **Live demo:** [https://my-cook-book-three.vercel.app/](https://your-app-url.com)

![Recipe builder screenshot](./docs/screenshots/recipe-builder.png)

## 🛠️ Tech Stack

| Layer      | Technology                    |
| ---------- | ----------------------------- |
| Framework  | Next.js (App Router)          |
| Language   | TypeScript                    |
| ORM        | Prisma                        |
| Database   | PostgreSQL                    |
| Auth       | Better Auth                   |
| Styling    | e.g. Tailwind CSS             |
| Hosting    | e.g. Vercel                   |

<!-- Next.js is full-stack: pages AND API/server logic live in one app.
     There is no separate backend server — Prisma + Better Auth run inside it. -->

## 🚀 Getting Started

### Prerequisites

- Node.js >= 20
- npm (or pnpm / yarn)
- A PostgreSQL database — either running locally or a hosted connection string
  (e.g. Neon, Supabase, Railway)

### Installation

```bash
# 1. Clone the repo
git clone https://github.com/your-username/project-name.git
cd project-name

# 2. Install dependencies
npm install
```

### Environment Variables

Create a `.env` file in the project root. Document every variable — missing env
vars are the #1 cause of "it won't run on my machine."

```env
# PostgreSQL connection string (used by Prisma)
DATABASE_URL="postgresql://user:password@localhost:5432/mealplanner"

# Better Auth
BETTER_AUTH_SECRET="run: openssl rand -base64 32 to generate one"
BETTER_AUTH_URL="http://localhost:3000"
```

> 💡 Commit a `.env.example` with blank/placeholder values so others know what's
> required, without leaking your real secrets. Keep `.env` in `.gitignore`.

### Database Setup

Prisma turns your schema into real database tables:

```bash
# Generate the Prisma client from your schema
npx prisma generate

# Create the tables in your database (runs migrations)
npx prisma migrate dev
```

> 💡 `npx prisma studio` opens a browser GUI to view and edit your data — handy
> for debugging.

### Running the App

```bash
npm run dev
```

The app runs at `http://localhost:3000`.

## 📁 Project Structure

```
project-name/
├── prisma/
│   └── schema.prisma      # Database models & schema (the source of truth)
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── api/           # API route handlers (your "backend" endpoints)
│   │   ├── (routes)/      # Page-level views
│   │   └── layout.tsx     # Root layout
│   ├── components/        # Reusable UI components
│   └── lib/
│       ├── auth.ts        # Better Auth configuration
│       └── prisma.ts      # Prisma client instance
├── public/                # Static assets (images, icons)
├── .env                   # Environment variables (not committed)
└── package.json
```

<!-- Some Next.js setups skip the `src/` folder and put `app/` at the root.
     Adjust this tree to match yours. -->

## 📡 Key Routes / API

<!-- Optional. A short table of the main API routes under app/api. -->

| Method | Endpoint         | Description       |
| ------ | ---------------- | ----------------- |
| GET    | `/api/recipes`   | List all recipes  |
| POST   | `/api/recipes`   | Create a recipe   |
| GET    | `/api/plans/:id` | Get a meal plan   |

## 🗺️ Roadmap

- [ ] Nutrition totals per meal plan
- [ ] Share plans with other users
- [ ] Mobile-responsive drag-and-drop
- <!-- What you'd build next -->

## 📄 License

Distributed under the MIT License. See `LICENSE` for details.

## 📬 Contact

Your Name — [@yourhandle](https://twitter.com/yourhandle) — email@example.com
