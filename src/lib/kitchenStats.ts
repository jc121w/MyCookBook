// Everything the profile page shows, computed from the user's books and entries.
// Server-only: called from the profile page (a server component) with Prisma.
import prisma from "@/lib/db";

type Nutrients = Record<string, { quantity: number; unit: string }> | null;

export type KitchenStats = Awaited<ReturnType<typeof getKitchenStats>>;

export async function getKitchenStats(userId: string) {
  // One query: every book with just the fields we need, plus its entries
  const books = await prisma.recipe.findMany({
    where: { userId },
    select: {
      id: true,
      label: true,
      image: true,
      source: true,
      yield: true,
      totalTime: true,
      calories: true,
      totalNutrients: true,
      cuisineType: true,
      entries: { select: { cookedOn: true, rating: true, photoUrl: true } },
    },
  });

  const entries = books.flatMap((b) => b.entries);
  const meals = entries.length;

  // ── Big numbers ──
  const minutes = books.reduce(
    (sum, b) => sum + b.totalTime * b.entries.length,
    0,
  );
  const photos = entries.filter((e) => e.photoUrl).length;
  const ratings = entries
    .map((e) => e.rating)
    .filter((r): r is number => r != null);
  const avgRating = ratings.length ? round1(average(ratings)) : null;

  // ── Recipes you come back to ──
  const cooked = books
    .filter((b) => b.entries.length > 0)
    .map((b) => {
      const rated = b.entries
        .map((e) => e.rating)
        .filter((r): r is number => r != null);
      return {
        id: b.id,
        label: b.label,
        image: b.image,
        source: b.source,
        cooks: b.entries.length,
        avgRating: rated.length ? round1(average(rated)) : null,
        // Your own latest photo of it beats the recipe's stock image
        photo:
          [...b.entries].sort(byNewest).find((e) => e.photoUrl)?.photoUrl ??
          b.image,
      };
    });

  const mostCooked = [...cooked].sort((a, b) => b.cooks - a.cooks).slice(0, 3);

  // Favorite = your highest-rated recipe (ties → the one you cook more).
  // Nothing rated yet → the one you cook most.
  const favorite =
    [...cooked]
      .filter((r) => r.avgRating != null)
      .sort((a, b) => b.avgRating! - a.avgRating! || b.cooks - a.cooks)[0] ??
    mostCooked[0] ??
    null;

  // ── An average meal, per serving, weighted by how often you cook each recipe ──
  const perServing = (b: (typeof books)[number], key: string) => {
    const n = (b.totalNutrients as Nutrients)?.[key];
    return n && b.yield > 0 ? n.quantity / b.yield : null;
  };
  const avgPerMeal = (key: string) => {
    const values = books.flatMap((b) => {
      const v = perServing(b, key);
      return v == null ? [] : Array(b.entries.length).fill(v);
    });
    return values.length ? Math.round(average(values)) : null;
  };
  const caloriesPerMeal = (() => {
    const values = books.flatMap((b) =>
      b.calories != null && b.yield > 0
        ? Array(b.entries.length).fill(b.calories / b.yield)
        : [],
    );
    return values.length ? Math.round(average(values)) : null;
  })();
  const nutrition = {
    calories: caloriesPerMeal,
    protein: avgPerMeal("PROCNT"),
    carbs: avgPerMeal("CHOCDF"),
    fat: avgPerMeal("FAT"),
  };

  // ── Patterns ──
  const cuisineCounts = new Map<string, number>();
  for (const b of books) {
    const cuisine = b.cuisineType[0];
    if (cuisine && b.entries.length)
      cuisineCounts.set(
        cuisine,
        (cuisineCounts.get(cuisine) ?? 0) + b.entries.length,
      );
  }
  const topCuisine =
    [...cuisineCounts].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  const dates = entries.map((e) => e.cookedOn.getTime()).sort((a, b) => a - b);
  const firstCook = dates.length ? new Date(dates[0]) : null;

  const now = new Date();
  const thisMonth = entries.filter(
    (e) =>
      e.cookedOn.getUTCFullYear() === now.getFullYear() &&
      e.cookedOn.getUTCMonth() === now.getMonth(),
  ).length;

  return {
    meals,
    books: books.length,
    cookedRecipes: cooked.length, // books you've actually cooked at least once
    hours: Math.round((minutes / 60) * 10) / 10,
    photos,
    avgRating,
    ratedCount: ratings.length,
    favorite,
    mostCooked,
    nutrition,
    topCuisine,
    firstCook,
    thisMonth,
  };
}

const average = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const round1 = (n: number) => Math.round(n * 10) / 10;
const byNewest = (a: { cookedOn: Date }, b: { cookedOn: Date }) =>
  b.cookedOn.getTime() - a.cookedOn.getTime();
