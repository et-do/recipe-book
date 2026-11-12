/**
 * Frontmatter schemas for content/. The reference for authors is
 * docs/recipe-format.md; keep the two in step.
 *
 * Objects are strict, so a misspelt key (`qyt:`) fails the build instead of
 * being silently dropped.
 */
import { z } from 'astro/zod';
import { analyseSteps } from './steps';

/** Permanent ids and slugs: lowercase words joined by single hyphens. */
export const kebab = z
  .string()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'must be kebab-case, e.g. "baking-soda"');

/** Units allowed in source files. Grams for anything that can be weighed. */
export const UNITS = ['g', 'each'] as const;

export const ingredientLine = z
  .strictObject({
    /** Handle used by steps. Also the ingredient page id unless `ref` is set. */
    id: kebab,
    /** Display name. */
    item: z.string().min(1),
    /** null = unmeasured ("to taste"); then `note` says what to do. */
    qty: z.number().positive().nullable(),
    unit: z.enum(UNITS).optional(),
    /** Secondary measure shown in grey: "¼ tsp", "2 large". */
    alt: z.string().min(1).optional(),
    note: z.string().min(1).optional(),
    /** Ingredient page id, when `id` differs (two lots of sugar, say). */
    ref: kebab.optional(),
  })
  .superRefine((ing, ctx) => {
    if (ing.qty !== null && ing.unit === undefined) {
      ctx.addIssue({ code: 'custom', path: ['unit'], message: `"${ing.id}" has a qty but no unit (use g, or each)` });
    }
    if (ing.qty === null && ing.note === undefined) {
      ctx.addIssue({ code: 'custom', path: ['note'], message: `"${ing.id}" has no qty, so it needs a note ("to taste")` });
    }
  });

export const step = z.strictObject({
  /** The action, short: "melt", "fold in". */
  do: z.string().min(1),
  /** Ingredient ids and named step results added at this step. */
  use: z.array(kebab).default([]),
  /** Begin a sub-assembly instead of continuing the previous result. */
  start: z.boolean().optional(),
  /** Name this step's result so a later step can `use` it. */
  id: kebab.optional(),
  /** Small print under the action: time, temperature, cue. */
  detail: z.string().min(1).optional(),
});

const minutes = z.number().int().nonnegative();

/** A source that inspired or informed the recipe. */
export const credit = z.strictObject({
  /** What it is: page title, book, person. */
  title: z.string().min(1),
  url: z.url({ protocol: /^https?$/ }).optional(),
  /** What was taken or changed: "base ratio", "halved the sugar". */
  note: z.string().min(1).optional(),
});

export const recipe = z
  .strictObject({
    title: z.string().min(1),
    description: z.string().min(1),
    tags: z.array(kebab).default([]),
    yield: z.strictObject({ qty: z.number().positive(), unit: z.string().min(1) }),
    time: z.strictObject({ active: minutes, total: minutes }),
    equipment: z.array(z.string().min(1)).default([]),
    ratio_base: kebab.optional(),
    prep: z.array(z.string().min(1)).default([]),
    ingredients: z.array(ingredientLine).min(1),
    steps: z.array(step).min(1),
    credits: z.array(credit).default([]),
  })
  .superRefine((r, ctx) => {
    if (r.time.total < r.time.active) {
      ctx.addIssue({ code: 'custom', path: ['time', 'total'], message: 'total time is less than active time' });
    }
    if (r.ratio_base !== undefined) {
      const base = r.ingredients.find((i) => i.id === r.ratio_base);
      if (base === undefined) {
        ctx.addIssue({ code: 'custom', path: ['ratio_base'], message: `"${r.ratio_base}" is not an ingredient id` });
      } else if (base.unit !== 'g' || base.qty === null) {
        ctx.addIssue({ code: 'custom', path: ['ratio_base'], message: `"${r.ratio_base}" must be weighed in g` });
      }
    }
    for (const issue of analyseSteps(r.ingredients, r.steps).issues) {
      ctx.addIssue({
        code: 'custom',
        path: issue.step === undefined ? ['ingredients'] : ['steps', issue.step],
        message: issue.message,
      });
    }
  });

/** Ingredient and technique wiki pages. */
export const wikiPage = z.strictObject({
  title: z.string().min(1),
  description: z.string().min(1).optional(),
  tags: z.array(kebab).default([]),
});

export type Recipe = z.infer<typeof recipe>;
export type IngredientLine = z.infer<typeof ingredientLine>;
export type Step = z.infer<typeof step>;
export type Credit = z.infer<typeof credit>;
