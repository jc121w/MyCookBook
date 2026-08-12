// types.ts
export interface Nutrition {
  nutrients: {
    amount: number;
  }[];
}
export interface Recipe {
  uri: string;
  label: string;
  image: string;
  images: {
    THUMBNAIL: { url: string; width: number; height: number };
    SMALL: { url: string; width: number; height: number };
    REGULAR: { url: string; width: number; height: number };
    LARGE?: { url: string; width: number; height: number };
  };
  source: string;
  url: string; // Link to original recipe (for cooking instructions)
  yield: number;
  dietLabels: string[];
  healthLabels: string[];
  ingredientLines: string[];
  ingredients: {
    foodId: string;
    quantity: number;
    measure: { uri: string; label: string };
    weight: number;
    food: string;
    foodCategory: string;
  }[];
  calories: number;
  totalWeight: number;
  totalTime: number;
  cuisineType: string[];
  mealType: string[];
  dishType: string[];
  totalNutrients: Record<
    string,
    {
      label: string;
      quantity: number;
      unit: string;
    }
  >;
  totalDaily: Record<
    string,
    {
      label: string;
      quantity: number;
      unit: string;
    }
  >;
}

// Types for recipes saved in the local Prisma database
export interface SavedNutrient {
  id: number;
  name: string;
  amount: number;
  unit: string;
  recipeId: number;
}

export interface SavedIngredient {
  id: number;
  name: string;
  amount: number;
  unit: string;
  recipeId: number;
}

export interface SavedStep {
  id: number;
  number: number;
  stepIngredients: string[];
  step: string;
  recipeId: number;
}

export interface RecipeSimplified {
  id: number;
  title: string;
  image: string;
  cheap: boolean;
  readyInMinutes: number;
  servings: number;
  summary: string;
  nutrients: SavedNutrient[];
  ingredients: SavedIngredient[];
  steps: SavedStep[];
  createdAt?: string;
  updatedAt?: string;
}

export interface EdamamSearchResponse {
  from: number;
  to: number;
  count: number;
  _links: {
    next?: { href: string; title: string };
  };
  hits: {
    recipe: Recipe;
    _links: { self: { href: string } };
  }[];
}
