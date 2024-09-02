// types.ts
export interface Nutrition {
  nutrients: {
    amount: number;
  }[];
}
export interface Recipe {
  id: number;
  title: string;
  image: string;
  nutrition: {
    nutrients: {
      name: string;
      amount: number;
      unit: string;
    }[];
    ingredients: { name: string; amount: number; unit: string }[];
  };
  summary: string;
  analyzedInstructions: {
    steps: {
      number: number;
      ingredients: { name: string }[];
      step: string;
    }[];
  }[];
  cheap: boolean;
  readyInMinutes: number;
  servings: number;
}
export interface RecipeSimplified {
  id: number;
  title: string;
  image: string;
  cheap: boolean;
  readyInMinutes: number;
  servings: number;
  summary: string;
  nutrients: {
    name: string;
    amount: number;
    unit: string;
  }[];
  ingredients: { name: string; amount: number; unit: string }[];
  steps: {
    number: number;
    stepIngredients: { name: string }[];
    step: string;
  }[];
}
export interface Step {
  number: number;
  step: string;
  ingredients: Ingredient[];
}

export interface Ingredient {
  id: number;
  name: string;
  amount: number;
  unit: string;
}

export interface Nutrient {
  name: string;
  amount: number;
  unit: string;
}
