import { describe, expect, it } from 'vitest';
import { layoutChart, type Chart } from './chart';
import { fixtures } from './fixtures';
import { recipe } from './schema';

/** Every (row, step column) slot is covered exactly once, by a gap or a step cell. */
function coverage(chart: Chart): number[][] {
  const grid = chart.rows.map(() => new Array<number>(chart.columns + 1).fill(0));
  chart.rows.forEach((row, r) => {
    for (let c = 1; c <= row.gap; c++) grid[r]![c]!++;
    for (const cell of row.cells) {
      for (let rr = r; rr < r + cell.rowspan; rr++) grid[rr]![cell.col]!++;
    }
  });
  return grid.map((cols) => cols.slice(1));
}

const layouts = Object.fromEntries(
  Object.entries(fixtures).map(([name, f]) => {
    const r = recipe.parse(f);
    return [name, layoutChart(r.ingredients, r.steps)];
  }),
);

describe('layoutChart', () => {
  it.each(Object.keys(fixtures))('%s parses and tiles the grid exactly', (name) => {
    const chart = layouts[name]!;
    for (const row of coverage(chart)) expect(row.every((n) => n === 1)).toBe(true);
  });

  it('linear: one column per step, gaps before late ingredients', () => {
    const c = layouts.brownies!;
    expect(c.columns).toBe(5);
    expect(c.rows.map((r) => r.gap)).toEqual([0, 1, 1, 1, 2, 3, 3, 3, 3]);
    expect(c.rows[0]!.cells).toEqual([
      { step: 0, col: 1, rowspan: 1 },
      { step: 1, col: 2, rowspan: 4 },
      { step: 2, col: 3, rowspan: 5 },
      { step: 3, col: 4, rowspan: 9 },
      { step: 4, col: 5, rowspan: 9 },
    ]);
  });

  it('sub-assembly joined at the end sits next to where it joins', () => {
    const c = layouts.frostedCake!;
    // Cake: cream(1) beat-in(2) fold(3) bake(4) cool(5); frosting: beat(4) stir(5); spread(6).
    expect(c.columns).toBe(6);
    expect(c.rows[4]).toEqual({
      ingredient: 4,
      gap: 3,
      cells: [{ step: 5, col: 4, rowspan: 2 }, { step: 6, col: 5, rowspan: 3 }],
    });
    expect(c.rows[6]!.gap).toBe(4);
  });

  it('sub-assembly made first is pushed right to where it is used', () => {
    const c = layouts.pancakes!;
    // dry whisk is used by step 4 (col 3), so it sits in col 2.
    expect(c.columns).toBe(4);
    expect(c.rows[0]!.cells[0]).toEqual({ step: 0, col: 2, rowspan: 4 });
    expect(c.rows[0]!.gap).toBe(1);
  });

  it('no-cook single step', () => {
    const c = layouts.vinaigrette!;
    expect(c.columns).toBe(1);
    expect(c.rows[0]!.cells).toEqual([{ step: 0, col: 1, rowspan: 4 }]);
    expect(c.rows.map((r) => r.gap)).toEqual([0, 0, 0, 0]);
  });

  it('refuses invalid recipes', () => {
    expect(() => layoutChart([{ id: 'a' }, { id: 'b' }], [{ do: 'mix', use: ['a'] }])).toThrow(/never used/);
  });
});
