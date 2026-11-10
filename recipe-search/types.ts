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
  url: string;
  yield: number;
  dietLabels: string[];
  healthLabels: string[];
  ingredientLines: string[];
  calories: number;
  totalTime: number;
  cuisineType: string[];
  mealType: string[];
  dishType: string[];
  totalNutrients: Record<string, { label: string; quantity: number; unit: string }>;
  totalDaily: Record<string, { label: string; quantity: number; unit: string }>;
}

export interface EdamamSearchResponse {
  from: number;
  to: number;
  count: number;
  _links: { next?: { href: string; title: string } };
  hits: { recipe: Recipe; _links: { self: { href: string } } }[];
}
