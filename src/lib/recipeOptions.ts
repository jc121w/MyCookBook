// Category values for user-created recipes. They match Edamam's own values exactly
// (lowercase), so custom recipes land on the same shelves as saved Edamam recipes.

export const DISH_TYPES = [
  "main course",
  "side dish",
  "starter",
  "salad",
  "soup",
  "pasta",
  "pizza",
  "sandwiches",
  "seafood",
  "egg",
  "bread",
  "pancake",
  "desserts",
  "biscuits and cookies",
  "pies and tarts",
  "ice cream and custard",
  "sweets",
  "drinks",
  "alcohol cocktail",
  "condiments and sauces",
  "preserve",
] as const;

export const CUISINE_TYPES = [
  "american",
  "asian",
  "british",
  "caribbean",
  "central europe",
  "chinese",
  "eastern europe",
  "french",
  "greek",
  "indian",
  "italian",
  "japanese",
  "korean",
  "kosher",
  "mediterranean",
  "mexican",
  "middle eastern",
  "nordic",
  "south american",
  "south east asian",
  "world",
] as const;

export const MEAL_TYPES = [
  "breakfast",
  "brunch",
  "lunch/dinner",
  "snack",
  "teatime",
] as const;

// "lunch/dinner" → "Lunch/Dinner" for display
export const titleCase = (s: string) =>
  s.replace(/\b\w/g, (c) => c.toUpperCase());
