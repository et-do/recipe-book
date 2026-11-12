/**
 * Test and dev-preview recipes, one per chart shape. NOT published: real
 * recipes live in content/. Quantities are plausible but untested.
 */
import type { z } from 'astro/zod';
import type { recipe } from './schema';

type RecipeInput = z.input<typeof recipe>;

/** Linear: every step continues the previous one. Ethan's reference example. */
export const brownies: RecipeInput = {
  title: 'Brownies',
  description: 'Fudgy espresso brownies.',
  tags: ['chocolate', 'dessert'],
  yield: { qty: 16, unit: 'pieces' },
  time: { active: 15, total: 55 },
  equipment: ['20 cm square pan'],
  ratio_base: 'flour',
  prep: ['Butter and flour a 20 cm square pan', 'Preheat oven to 175 °C'],
  ingredients: [
    { id: 'butter', item: 'unsalted butter', qty: 115, unit: 'g' },
    { id: 'sugar', item: 'sugar', qty: 200, unit: 'g' },
    { id: 'vanilla', item: 'vanilla extract', qty: 2.5, unit: 'g', alt: '½ tsp' },
    { id: 'espresso', item: 'espresso', qty: 60, unit: 'g', alt: '2 shots' },
    { id: 'eggs', item: 'eggs', qty: 100, unit: 'g', alt: '2 large' },
    { id: 'flour', item: 'all-purpose flour', qty: 80, unit: 'g' },
    { id: 'cocoa', item: 'cocoa powder', qty: 80, unit: 'g' },
    { id: 'baking-soda', item: 'baking soda', qty: 1.3, unit: 'g', alt: '¼ tsp' },
    { id: 'salt', item: 'salt', qty: 1.5, unit: 'g', alt: '¼ tsp' },
  ],
  steps: [
    { do: 'melt', use: ['butter'] },
    { do: 'mix', use: ['sugar', 'vanilla', 'espresso'] },
    { do: 'mix', use: ['eggs'] },
    { do: 'fold in', use: ['flour', 'cocoa', 'baking-soda', 'salt'] },
    { do: 'bake', detail: '175 °C · 30–40 min' },
  ],
};

/** Sub-assembly made last and joined at the end (cake + frosting). */
export const frostedCake: RecipeInput = {
  title: 'Frosted cake',
  description: 'Sponge with cream cheese frosting.',
  yield: { qty: 1, unit: '20 cm cake' },
  time: { active: 30, total: 90 },
  prep: ['Line a 20 cm round tin', 'Preheat oven to 180 °C'],
  ingredients: [
    { id: 'butter', item: 'unsalted butter', qty: 175, unit: 'g' },
    { id: 'sugar', item: 'caster sugar', qty: 175, unit: 'g' },
    { id: 'eggs', item: 'eggs', qty: 150, unit: 'g', alt: '3 large' },
    { id: 'flour', item: 'self-raising flour', qty: 175, unit: 'g' },
    { id: 'cream-cheese', item: 'cream cheese', qty: 200, unit: 'g' },
    { id: 'icing-sugar', item: 'icing sugar', qty: 100, unit: 'g', ref: 'sugar' },
    { id: 'lemon-zest', item: 'lemon zest', qty: 1, unit: 'each', alt: '1 lemon' },
  ],
  steps: [
    { do: 'cream', use: ['butter', 'sugar'], detail: 'pale, 3 min' },
    { do: 'beat in', use: ['eggs'] },
    { do: 'fold in', use: ['flour'] },
    { do: 'bake', detail: '180 °C · 25 min' },
    { do: 'cool', id: 'cake' },
    { do: 'beat', use: ['cream-cheese', 'icing-sugar'], start: true },
    { do: 'stir in', use: ['lemon-zest'] },
    { do: 'spread on', use: ['cake'] },
  ],
};

/** Sub-assembly made first (dry mix), then a wet chain that joins it. */
export const pancakes: RecipeInput = {
  title: 'Pancakes',
  description: 'Thick buttermilk pancakes.',
  yield: { qty: 8, unit: 'pancakes' },
  time: { active: 25, total: 25 },
  ingredients: [
    { id: 'flour', item: 'all-purpose flour', qty: 200, unit: 'g' },
    { id: 'sugar', item: 'sugar', qty: 25, unit: 'g' },
    { id: 'baking-powder', item: 'baking powder', qty: 8, unit: 'g', alt: '2 tsp' },
    { id: 'salt', item: 'salt', qty: null, note: 'a pinch' },
    { id: 'buttermilk', item: 'buttermilk', qty: 300, unit: 'g' },
    { id: 'eggs', item: 'egg', qty: 50, unit: 'g', alt: '1 large' },
    { id: 'butter', item: 'melted butter', qty: 30, unit: 'g' },
  ],
  steps: [
    { do: 'whisk', use: ['flour', 'sugar', 'baking-powder', 'salt'], id: 'dry' },
    { do: 'whisk', use: ['buttermilk', 'eggs'], start: true },
    { do: 'whisk in', use: ['butter'] },
    { do: 'fold into', use: ['dry'], detail: 'lumps are fine' },
    { do: 'fry', detail: 'medium heat · 2 min a side' },
  ],
};

/** No-cook, one step. */
export const vinaigrette: RecipeInput = {
  title: 'Vinaigrette',
  description: 'Everyday mustard vinaigrette.',
  yield: { qty: 1, unit: 'jar' },
  time: { active: 5, total: 5 },
  ingredients: [
    { id: 'oil', item: 'olive oil', qty: 90, unit: 'g' },
    { id: 'vinegar', item: 'red wine vinegar', qty: 30, unit: 'g' },
    { id: 'mustard', item: 'Dijon mustard', qty: 5, unit: 'g', alt: '1 tsp' },
    { id: 'salt', item: 'salt', qty: null, note: 'to taste' },
  ],
  steps: [{ do: 'shake', use: ['oil', 'vinegar', 'mustard', 'salt'], detail: 'in a jar' }],
  credits: [{ title: 'Example credit', url: 'https://example.com/', note: 'the 3:1 ratio' }],
};

/** Two sub-assemblies joined into a main chain mid-way. */
export const tacos: RecipeInput = {
  title: 'Fish tacos',
  description: 'Fish tacos with slaw and lime crema.',
  yield: { qty: 8, unit: 'tacos' },
  time: { active: 35, total: 35 },
  ingredients: [
    { id: 'cabbage', item: 'red cabbage, shredded', qty: 200, unit: 'g' },
    { id: 'lime-slaw', item: 'lime juice', qty: 15, unit: 'g', ref: 'lime' },
    { id: 'salt-slaw', item: 'salt', qty: 2, unit: 'g', ref: 'salt' },
    { id: 'sour-cream', item: 'sour cream', qty: 120, unit: 'g' },
    { id: 'lime-crema', item: 'lime juice', qty: 10, unit: 'g', ref: 'lime' },
    { id: 'fish', item: 'white fish fillets', qty: 500, unit: 'g' },
    { id: 'spice', item: 'chilli powder', qty: 4, unit: 'g', alt: '1 tsp' },
    { id: 'oil', item: 'neutral oil', qty: 15, unit: 'g' },
    { id: 'tortillas', item: 'corn tortillas', qty: 8, unit: 'each' },
  ],
  steps: [
    { do: 'toss', use: ['cabbage', 'lime-slaw', 'salt-slaw'], detail: 'rest 15 min', id: 'slaw' },
    { do: 'stir', use: ['sour-cream', 'lime-crema'], start: true, id: 'crema' },
    { do: 'season', use: ['fish', 'spice'], start: true },
    { do: 'fry', use: ['oil'], detail: '3 min a side' },
    { do: 'flake into', use: ['tortillas'] },
    { do: 'top with', use: ['slaw', 'crema'] },
  ],
};

export const fixtures = { brownies, frostedCake, pancakes, vinaigrette, tacos };
