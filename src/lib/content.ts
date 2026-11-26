/**
 * Collection helpers shared by pages: categories, backlinks, formatting.
 */
import { getCollection, type CollectionEntry } from 'astro:content';
import { linkedSlugs, pageUrl, scanContent, type PageRef } from './wiki/index';

export type RecipeEntry = CollectionEntry<'recipes'>;
export type WikiEntry = CollectionEntry<'ingredients'> | CollectionEntry<'techniques'>;

const byTitle = (a: { data: { title: string } }, b: { data: { title: string } }) =>
  a.data.title.localeCompare(b.data.title);

export async function getRecipes(): Promise<RecipeEntry[]> {
  return (await getCollection('recipes')).sort(byTitle);
}
export async function getIngredients() {
  return (await getCollection('ingredients')).sort(byTitle);
}
export async function getTechniques() {
  return (await getCollection('techniques')).sort(byTitle);
}

/** A recipe's category is its folder: content/recipes/<category>/<slug>.md */
export function categoryOf(entry: RecipeEntry): string {
  const parts = entry.filePath!.split(/[\\/]/);
  return parts[parts.length - 2]!;
}

export const humanise = (kebab: string) => {
  const s = kebab.replace(/-/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export const categoryUrl = (category: string) => `/categories/${category}/`;
export const tagUrl = (tag: string) => `/tags/${tag}/`;
export const recipeUrl = (slug: string) => pageUrl('recipe', slug);

/** Recipes grouped by category, categories A-Z. */
export async function recipesByCategory(): Promise<[string, RecipeEntry[]][]> {
  const groups = new Map<string, RecipeEntry[]>();
  for (const r of await getRecipes()) {
    const c = categoryOf(r);
    groups.set(c, [...(groups.get(c) ?? []), r]);
  }
  return [...groups].sort(([a], [b]) => a.localeCompare(b));
}

/** Every slug's text that can hold wiki links: body plus step notes/details. */
function linkableText(entry: RecipeEntry | WikiEntry): string {
  const parts = [entry.body ?? ''];
  if (entry.collection === 'recipes') {
    for (const s of entry.data.steps) parts.push(s.detail ?? '', s.note ?? '');
  }
  return parts.join('\n');
}

/** Pages whose text links to `slug`, A-Z. */
export async function backlinks(slug: string): Promise<PageRef[]> {
  const index = scanContent();
  const all = [...(await getRecipes()), ...(await getIngredients()), ...(await getTechniques())];
  return all
    .filter((e) => e.id !== slug && linkedSlugs(linkableText(e)).includes(slug))
    .map((e) => index.get(e.id)!)
    .sort((a, b) => a.title.localeCompare(b.title));
}

/** The ingredient page an ingredient line belongs to. */
export const ingredientPageId = (ing: { id: string; ref?: string | undefined }) => ing.ref ?? ing.id;

/** Recipes that list this ingredient (by id or ref). */
export async function recipesUsing(ingredientId: string): Promise<RecipeEntry[]> {
  return (await getRecipes()).filter((r) => r.data.ingredients.some((i) => ingredientPageId(i) === ingredientId));
}

/** 75 -> "1 h 15 min". */
export function formatMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

/** Split rendered body HTML into the intro (before the first ## heading) and the sections. */
export function splitIntro(html: string): { intro: string; sections: string } {
  const at = html.search(/<h2[\s>]/);
  return at < 0 ? { intro: html, sections: '' } : { intro: html.slice(0, at), sections: html.slice(at) };
}
