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
