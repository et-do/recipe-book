import { getIngredients, getRecipes, getTechniques, type RecipeEntry, type WikiEntry } from './content';

export interface TagGroup {
  tag: string;
  recipes: RecipeEntry[];
  pages: WikiEntry[];
}

/** Every tag used anywhere, A-Z, with what uses it. */
export async function getTags(): Promise<TagGroup[]> {
  const tags = new Map<string, TagGroup>();
  const group = (tag: string) => {
    let g = tags.get(tag);
    if (!g) tags.set(tag, (g = { tag, recipes: [], pages: [] }));
    return g;
  };
  for (const r of await getRecipes()) for (const t of r.data.tags) group(t).recipes.push(r);
  for (const p of [...(await getIngredients()), ...(await getTechniques())]) {
    for (const t of p.data.tags) group(t).pages.push(p);
  }
  return [...tags.values()].sort((a, b) => a.tag.localeCompare(b.tag));
}
