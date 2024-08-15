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
      amount: number;
    }[];
  };
  description: string;
  summary: string;
  analyzedInstructions: {
    steps: {
      ingredients: { name: string }[];
      step: string;
    }[];
  }[];
}
export interface PrismaRecipe {
  id: number;
  name: string;
  src: string;
  calories: number;
  description: string | null;
  ingredients: string;
  instructions: string;
  createdAt: Date;
  updatedAt: Date;
}
