// Commit message rules. See docs/commits.md for what each type means.
// Used by the commit-msg hook, by CI, and by `npm run commit` (commitizen),
// which builds its prompts from the type list below.

/** Cookbook types first, then hidden housekeeping types. */
const types = {
  recipe: 'A new recipe',
  tweak: 'Changing an existing recipe (amounts, steps, notes, log)',
  wiki: 'Ingredient or technique pages',
  feat: 'Something new on the site or in the book view',
  fix: 'Something broken on the site, or a recipe error',
  docs: 'Housekeeping: documentation',
  chore: 'Housekeeping: tooling, dependencies, dev environment',
  build: 'Housekeeping: build setup',
  ci: 'Housekeeping: GitHub Actions',
  test: 'Housekeeping: tests',
  refactor: 'Housekeeping: code change with no visible effect',
  style: 'Housekeeping: formatting only',
  perf: 'Housekeeping: speed',
  revert: 'Undo an earlier commit',
};

/** @type {import('@commitlint/types').UserConfig} */
export default {
  extends: ['@commitlint/config-conventional'],
  // release-please writes its own release commits.
  ignores: [(message) => /^chore(\([\w-]+\))?: release /.test(message)],
  plugins: [
    {
      rules: {
        'no-co-author': ({ raw }) => [
          !/^co-authored-by:/im.test(raw ?? ''),
          'no Co-authored-by trailers in this repo',
        ],
      },
    },
  ],
  rules: {
    'type-enum': [2, 'always', Object.keys(types)],
    // Scope is a recipe or page slug, so kebab-case like the slugs.
    'scope-case': [2, 'always', 'kebab-case'],
    // One or two sentences in total: a short header, and a body of at most
    // a sentence or two.
    'header-max-length': [2, 'always', 100],
    'body-max-length': [2, 'always', 300],
    'no-co-author': [2, 'always'],
  },
  prompt: {
    questions: {
      type: {
        enum: Object.fromEntries(
          Object.entries(types).map(([type, description]) => [
            type,
            { description, title: type },
          ]),
        ),
      },
      scope: {
        description: 'Recipe or page slug, if there is one (e.g. brownies)',
      },
    },
  },
};
