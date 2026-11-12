import { describe, expect, it } from 'vitest';
import { analyseSteps, type StepInput } from './steps';
import { recipe } from './schema';

const ings = (...ids: string[]) => ids.map((id) => ({ id }));
const messages = (ids: string[], steps: StepInput[]) =>
  analyseSteps(ings(...ids), steps).issues.map((i) => i.message);

describe('analyseSteps: valid shapes', () => {
  it('linear (brownies from docs/recipe-format.md)', () => {
    const { nodes, issues } = analyseSteps(
      ings('butter', 'sugar', 'vanilla', 'espresso', 'eggs', 'flour', 'cocoa', 'baking-soda', 'salt'),
      [
        { do: 'melt', use: ['butter'] },
        { do: 'mix', use: ['sugar', 'vanilla', 'espresso'] },
        { do: 'mix', use: ['eggs'] },
        { do: 'fold in', use: ['flour', 'cocoa', 'baking-soda', 'salt'] },
        { do: 'bake', detail: '175 °C · 30–40 min' },
      ],
    );
    expect(issues).toEqual([]);
    expect(nodes.map((n) => [n.first, n.last])).toEqual([
      [0, 0],
      [0, 3],
      [0, 4],
      [0, 8],
      [0, 8],
    ]);
    expect(nodes[1]!.inputs).toEqual([
      { kind: 'step', index: 0 },
      { kind: 'ingredient', row: 1 },
      { kind: 'ingredient', row: 2 },
      { kind: 'ingredient', row: 3 },
    ]);
  });

  it('sub-assembly (cake with a separately made frosting)', () => {
    const { nodes, issues } = analyseSteps(
      ings('butter', 'sugar', 'eggs', 'flour', 'cream-cheese', 'icing-sugar'),
      [
        { do: 'cream', use: ['butter', 'sugar'] },
        { do: 'beat in', use: ['eggs'] },
        { do: 'fold in', use: ['flour'] },
        { do: 'bake', id: 'cake' },
        { do: 'beat', use: ['cream-cheese', 'icing-sugar'], start: true },
        { do: 'spread on', use: ['cake'] },
      ],
    );
    expect(issues).toEqual([]);
    expect(nodes[4]).toMatchObject({ first: 4, last: 5 });
    expect(nodes[5]).toMatchObject({ first: 0, last: 5 });
    expect(nodes[5]!.inputs).toEqual([
      { kind: 'step', index: 4 },
      { kind: 'step', index: 3 },
    ]);
  });

  it('sub-assembly made first, joined by a later chain', () => {
    const { issues } = analyseSteps(ings('flour', 'cocoa', 'butter', 'sugar'), [
      { do: 'sift', use: ['flour', 'cocoa'], id: 'dry' },
      { do: 'cream', use: ['butter', 'sugar'], start: true },
      { do: 'fold in', use: ['dry'] },
    ]);
    expect(issues).toEqual([]);
  });

  it('no-cook, single step', () => {
    const { nodes, issues } = analyseSteps(ings('oil', 'vinegar', 'mustard', 'salt'), [
      { do: 'shake', use: ['oil', 'vinegar', 'mustard', 'salt'] },
    ]);
    expect(issues).toEqual([]);
    expect(nodes[0]).toMatchObject({ first: 0, last: 3 });
  });
});

describe('analyseSteps: rule violations', () => {
  it('unknown id', () => {
    expect(messages(['a'], [{ do: 'mix', use: ['a', 'b'] }])).toEqual([
      'step 1 ("mix"): "b" is not an ingredient id or a step id',
    ]);
  });

  it('unused ingredient', () => {
    expect(messages(['a', 'b'], [{ do: 'mix', use: ['a'] }])).toEqual(['ingredient "b" is never used by a step']);
  });

  it('ingredient used twice', () => {
    expect(messages(['a'], [{ do: 'melt', use: ['a'] }, { do: 'mix', use: ['a'] }])).toEqual([
      'step 2 ("mix"): ingredient "a" is already used by an earlier step',
    ]);
  });

  it('non-adjacent rows', () => {
    expect(messages(['a', 'b', 'c'], [{ do: 'mix', use: ['a', 'c'] }, { do: 'add', use: ['b'] }])).toEqual([
      'step 1 ("mix") combines rows that are not next to each other; move "b" so the ingredients are listed in the order they go in',
    ]);
  });

  it('first step acts on nothing', () => {
    expect(messages(['a'], [{ do: 'preheat' }, { do: 'mix', use: ['a'] }])).toContain(
      'step 1 ("preheat") acts on nothing; list ingredients in "use", or move it to "prep"',
    );
  });

  it('start: true abandons an unnamed result', () => {
    expect(messages(['a', 'b'], [{ do: 'melt', use: ['a'] }, { do: 'mix', use: ['b'], start: true }])).toEqual([
      'step 1 ("melt"): its result is never used (step 2 starts fresh); give it an id and use it later',
    ]);
  });

  it('named result never used', () => {
    expect(
      messages(['a', 'b'], [{ do: 'melt', use: ['a'], id: 'x' }, { do: 'mix', use: ['b'], start: true }]),
    ).toEqual(['step 1 ("melt"): result "x" is never used']);
  });

  it('step after a named result without start', () => {
    expect(messages(['a', 'b'], [{ do: 'melt', use: ['a'], id: 'x' }, { do: 'mix', use: ['b', 'x'] }])).toEqual([
      'step 2 ("mix") follows a named sub-assembly; add "start: true" to begin a new one, or use the name',
    ]);
  });

  it('named result used before it is made, or twice', () => {
    const msgs = messages(
      ['a', 'b', 'c'],
      [
        { do: 'mix', use: ['a', 'x'] },
        { do: 'melt', use: ['b'], id: 'x', start: true },
        { do: 'add', use: ['c', 'x'], start: true },
      ],
    );
    expect(msgs).toContain('step 1 ("mix"): uses "x" before step 2 makes it');
  });

  it('last step named', () => {
    expect(messages(['a'], [{ do: 'mix', use: ['a'], id: 'x' }])).toEqual([
      'step 1 ("mix") is the last step, so it should not have an id',
    ]);
  });

  it('duplicate ids', () => {
    expect(messages(['a', 'a'], [{ do: 'mix', use: ['a'] }])).toContain(
      'ingredient id "a" is used for more than one ingredient',
    );
  });
});

describe('recipe schema', () => {
  const base = {
    title: 'T',
    description: 'D',
    yield: { qty: 1, unit: 'jar' },
    time: { active: 5, total: 5 },
    ingredients: [{ id: 'oil', item: 'olive oil', qty: 90, unit: 'g' }],
    steps: [{ do: 'pour', use: ['oil'] }],
  };

  it('accepts a minimal recipe and fills defaults', () => {
    const r = recipe.parse(base);
    expect(r.tags).toEqual([]);
    expect(r.prep).toEqual([]);
  });

  it('rejects misspelt keys', () => {
    expect(recipe.safeParse({ ...base, ingredients: [{ id: 'oil', item: 'oil', qyt: 90, unit: 'g' }] }).success).toBe(
      false,
    );
  });

  it('requires a unit when qty is set, and a note when it is not', () => {
    const noUnit = recipe.safeParse({ ...base, ingredients: [{ id: 'oil', item: 'oil', qty: 90 }] });
    expect(noUnit.error?.issues.map((i) => i.message)).toContain('"oil" has a qty but no unit (use g, or each)');
    const noNote = recipe.safeParse({ ...base, ingredients: [{ id: 'oil', item: 'oil', qty: null }] });
    expect(noNote.error?.issues.map((i) => i.message)).toContain(
      '"oil" has no qty, so it needs a note ("to taste")',
    );
  });

  it('rejects non-metric units and non-kebab ids', () => {
    expect(recipe.safeParse({ ...base, ingredients: [{ id: 'oil', item: 'oil', qty: 1, unit: 'cup' }] }).success).toBe(
      false,
    );
    expect(
      recipe.safeParse({
        ...base,
        ingredients: [{ id: 'Olive_Oil', item: 'oil', qty: 1, unit: 'g' }],
        steps: [{ do: 'pour', use: ['Olive_Oil'] }],
      }).success,
    ).toBe(false);
  });

  it('checks ratio_base and times', () => {
    const r = recipe.safeParse({ ...base, ratio_base: 'flour', time: { active: 10, total: 5 } });
    expect(r.error?.issues.map((i) => i.message)).toEqual([
      'total time is less than active time',
      '"flour" is not an ingredient id',
    ]);
  });

  it('surfaces step issues with a path to the step', () => {
    const r = recipe.safeParse({ ...base, steps: [{ do: 'pour', use: ['oil', 'salt'] }] });
    expect(r.error?.issues).toContainEqual(
      expect.objectContaining({ path: ['steps', 0], message: 'step 1 ("pour"): "salt" is not an ingredient id or a step id' }),
    );
  });
});
