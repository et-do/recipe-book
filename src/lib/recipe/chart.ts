/**
 * Layout for the "Cooking for Engineers" chart.
 *
 * Grid: one row per ingredient; step columns 1..columns to the right of the
 * ingredient columns. Each step is a cell one column wide spanning the rows
 * of everything it contains. A step sits in the column just before the step
 * that uses its result, and the last step is in the last column, so a
 * sub-assembly lines up next to where it joins. Between an ingredient and the
 * first step that uses it is a blank gap.
 *
 * Valid step graphs (no issues from analyseSteps) always tile the grid
 * exactly; chart.test.ts checks that.
 */
import { analyseSteps, type IngredientInput, type StepInput } from './steps';

export interface ChartCell {
  /** Index into `steps`. */
  step: number;
  /** Step column, 1-based. */
  col: number;
  rowspan: number;
}

export interface ChartRow {
  /** Index into `ingredients`. */
  ingredient: number;
  /** Blank step columns before the ingredient's first step (0 = none). */
  gap: number;
  /** Step cells whose top row is this row, left to right. */
  cells: ChartCell[];
}

export interface Chart {
  /** Number of step columns. */
  columns: number;
  rows: ChartRow[];
}

export function layoutChart(ingredients: readonly IngredientInput[], steps: readonly StepInput[]): Chart {
  const { nodes, issues } = analyseSteps(ingredients, steps);
  if (issues.length > 0) {
    throw new Error(`cannot lay out an invalid recipe:\n${issues.map((i) => `  ${i.message}`).join('\n')}`);
  }

  // Who consumes each step's result, and which step first takes each ingredient.
  const consumer = new Array<number>(steps.length).fill(-1);
  const takenBy = new Array<number>(ingredients.length).fill(-1);
  for (const node of nodes) {
    for (const input of node.inputs) {
      if (input.kind === 'step') consumer[input.index] = node.index;
      else takenBy[input.row] = node.index;
    }
  }

  // Height = longest chain of steps ending at this one. Inputs always come
  // before their consumer, so one forward pass is enough.
  const height = new Array<number>(steps.length).fill(1);
  for (const node of nodes) {
    for (const input of node.inputs) {
      if (input.kind === 'step') height[node.index] = Math.max(height[node.index]!, height[input.index]! + 1);
    }
  }

  const last = steps.length - 1;
  const columns = height[last]!;
  const col = new Array<number>(steps.length).fill(0);
  col[last] = columns;
  // Consumers always come after their inputs, so walk backwards.
  for (let i = last - 1; i >= 0; i--) col[i] = col[consumer[i]!]! - 1;

  const rows: ChartRow[] = ingredients.map((_, r) => ({ ingredient: r, gap: col[takenBy[r]!]! - 1, cells: [] }));
  for (const node of nodes) {
    rows[node.first]!.cells.push({ step: node.index, col: col[node.index]!, rowspan: node.last - node.first + 1 });
  }
  for (const row of rows) row.cells.sort((a, b) => a.col - b.col);

  return { columns, rows };
}
