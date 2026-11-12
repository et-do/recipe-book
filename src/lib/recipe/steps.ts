/**
 * Step analysis: works out what each step combines and which ingredient rows
 * it spans, and reports every violation of the step rules in
 * docs/recipe-format.md. The schema uses the issues to fail the build; the
 * chart uses the nodes to draw the cells.
 *
 * Pure and framework-free so it can be unit tested.
 */

export interface IngredientInput {
  id: string;
}

export interface StepInput {
  do: string;
  use?: string[];
  start?: boolean;
  id?: string;
  detail?: string;
}

/** What flows into a step. */
export type StepInputRef =
  | { kind: 'ingredient'; row: number }
  | { kind: 'step'; index: number };

export interface StepNode {
  /** Position in `steps`, 0-based. */
  index: number;
  /** Ingredient rows this step's result contains, 0-based and inclusive. */
  first: number;
  last: number;
  /** Direct inputs, in the order they go in. */
  inputs: StepInputRef[];
}

export interface Issue {
  message: string;
  /** Step index the issue belongs to, if any. */
  step?: number;
}

export interface Analysis {
  nodes: StepNode[];
  issues: Issue[];
}

export function analyseSteps(
  ingredients: readonly IngredientInput[],
  steps: readonly StepInput[],
): Analysis {
  const issues: Issue[] = [];
  const nodes: StepNode[] = [];
  const label = (i: number) => `step ${i + 1} ("${steps[i]!.do}")`;

  const rowOf = new Map<string, number>();
  ingredients.forEach((ing, row) => {
    if (rowOf.has(ing.id)) issues.push({ message: `ingredient id "${ing.id}" is used for more than one ingredient` });
    else rowOf.set(ing.id, row);
  });

  // Named sub-assembly results: id -> producing step index.
  const named = new Map<string, number>();
  steps.forEach((s, i) => {
    if (s.id === undefined) return;
    if (rowOf.has(s.id)) issues.push({ step: i, message: `${label(i)}: id "${s.id}" is already an ingredient id` });
    else if (named.has(s.id)) issues.push({ step: i, message: `${label(i)}: id "${s.id}" is used by more than one step` });
    else named.set(s.id, i);
  });

  const rowsOfStep: number[][] = [];
  const usedRows = new Set<number>();
  const consumedNamed = new Set<string>();
  /** Result carried into the next step, or null after a named step. */
  let carried: number | null = null;

  steps.forEach((step, i) => {
    const inputs: StepInputRef[] = [];
    const rows: number[] = [];

    if (i > 0 && !step.start) {
      if (carried === null) {
        issues.push({
          step: i,
          message: `${label(i)} follows a named sub-assembly; add "start: true" to begin a new one, or use the name`,
        });
      } else {
        inputs.push({ kind: 'step', index: carried });
        rows.push(...rowsOfStep[carried]!);
      }
    } else if (i > 0 && step.start && carried !== null) {
      issues.push({
        step: carried,
        message: `${label(carried)}: its result is never used (step ${i + 1} starts fresh); give it an id and use it later`,
      });
    }

    for (const ref of step.use ?? []) {
      const row = rowOf.get(ref);
      if (row !== undefined) {
        if (usedRows.has(row)) {
          issues.push({ step: i, message: `${label(i)}: ingredient "${ref}" is already used by an earlier step` });
          continue;
        }
        usedRows.add(row);
        inputs.push({ kind: 'ingredient', row });
        rows.push(row);
        continue;
      }
      const producer = named.get(ref);
      if (producer === undefined) {
        issues.push({ step: i, message: `${label(i)}: "${ref}" is not an ingredient id or a step id` });
      } else if (producer >= i) {
        issues.push({ step: i, message: `${label(i)}: uses "${ref}" before step ${producer + 1} makes it` });
      } else if (consumedNamed.has(ref)) {
        issues.push({ step: i, message: `${label(i)}: "${ref}" is already used by an earlier step` });
      } else {
        consumedNamed.add(ref);
        inputs.push({ kind: 'step', index: producer });
        rows.push(...rowsOfStep[producer]!);
      }
    }

    rows.sort((a, b) => a - b);
    rowsOfStep[i] = rows;

    if (rows.length === 0) {
      issues.push({
        step: i,
        message: `${label(i)} acts on nothing; list ingredients in "use", or move it to "prep"`,
      });
      nodes.push({ index: i, first: -1, last: -1, inputs });
    } else {
      const first = rows[0]!;
      const last = rows[rows.length - 1]!;
      const gap = [];
      for (let r = first; r <= last; r++) if (!rows.includes(r)) gap.push(ingredients[r]!.id);
      if (gap.length > 0) {
        issues.push({
          step: i,
          message:
            `${label(i)} combines rows that are not next to each other; ` +
            `move ${gap.map((g) => `"${g}"`).join(', ')} so the ingredients are listed in the order they go in`,
        });
      }
      nodes.push({ index: i, first, last, inputs });
    }

    carried = step.id === undefined ? i : null;
  });

  ingredients.forEach((ing, row) => {
    if (!usedRows.has(row) && rowOf.get(ing.id) === row) {
      issues.push({ message: `ingredient "${ing.id}" is never used by a step` });
    }
  });
  for (const [id, producer] of named) {
    // A named last step gets its own message below.
    if (!consumedNamed.has(id) && producer !== steps.length - 1) {
      issues.push({ step: producer, message: `${label(producer)}: result "${id}" is never used` });
    }
  }
  if (steps.length > 0 && carried === null) {
    const lastIndex = steps.length - 1;
    issues.push({
      step: lastIndex,
      message: `${label(lastIndex)} is the last step, so it should not have an id`,
    });
  }

  return { nodes, issues };
}
