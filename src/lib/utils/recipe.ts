export function extractRecipeId(uri: string): string {
  return uri.split("#recipe_")[1] ?? uri;
}
