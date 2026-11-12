/**
 * Content collections. Everything published lives in content/ at the repo
 * root; schemas are in src/lib/recipe/schema.ts.
 */
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { recipe, wikiPage, kebab } from './lib/recipe/schema';

/**
 * Entry id = file name without `.md`. The folder (a recipe's category) is not
 * part of the id, so links and URLs survive moving a recipe between
 * categories.
 */
function idFromFileName({ entry }: { entry: string }): string {
  const name = entry.split('/').pop()!.replace(/\.md$/, '');
  const result = kebab.safeParse(name);
  if (!result.success) {
    throw new Error(`content file name "${entry}" must be kebab-case, e.g. "brown-butter.md"`);
  }
  return name;
}

export const collections = {
  recipes: defineCollection({
    // Exactly one category folder deep: recipes/<category>/<slug>.md
    loader: glob({ base: './content/recipes', pattern: '*/*.md', generateId: idFromFileName }),
    schema: recipe,
  }),
  ingredients: defineCollection({
    loader: glob({ base: './content/ingredients', pattern: '*.md', generateId: idFromFileName }),
    schema: wikiPage,
  }),
  techniques: defineCollection({
    loader: glob({ base: './content/techniques', pattern: '*.md', generateId: idFromFileName }),
    schema: wikiPage,
  }),
};
