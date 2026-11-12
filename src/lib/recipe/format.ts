import type { IngredientLine } from './schema';

const number = new Intl.NumberFormat('en-CA', { maximumFractionDigits: 1 });

/** "115 g", "8", or "" for unmeasured (qty: null) ingredients. */
export function formatQty(ing: Pick<IngredientLine, 'qty' | 'unit'>): string {
  if (ing.qty === null) return '';
  const n = number.format(ing.qty);
  return ing.unit === 'g' ? `${n} g` : n;
}
