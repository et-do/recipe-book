# Commit messages and releases

Commits use [Conventional Commits](https://www.conventionalcommits.org/),
with types chosen for a cookbook rather than a software product. The type
decides which heading a change appears under in `CHANGELOG.md` and the
GitHub release notes.

| Type       | Use for                                          | Changelog heading           | Bump  |
| ---------- | ------------------------------------------------ | --------------------------- | ----- |
| `recipe`   | A new recipe                                     | New recipes                 | patch |
| `tweak`    | Changing an existing recipe (amounts, steps, notes, log) | Recipe changes      | patch |
| `wiki`     | Ingredient or technique pages                    | Ingredients and techniques  | patch |
| `feat`     | Something new on the site or in the book view    | Site and book               | minor |
| `fix`      | Something broken on the site, or a recipe error  | Fixes                       | patch |
| `docs`, `chore`, `build`, `ci`, `test`, `refactor`, `style`, `perf` | Repo housekeeping | hidden | none |

Add `!` after the type (`feat!:`) for a change that breaks existing
structure: a recipe format change that needs existing recipe files edited,
or changed URLs. That is a major bump (a minor bump while still below 1.0).

Use the recipe or page slug as the scope, so the changelog reads well:

    recipe(brownies): add espresso brownies
    tweak(brownies): cut the sugar to 180 g
    wiki(cocoa-powder): add Dutch-process vs natural
    feat: add servings scaler
    fix(brownies): bake time was in the wrong step

Keep the whole message to a sentence or two: a header of up to 100
characters, and an optional body of up to 300. No `Co-authored-by` trailers.

## Checks

- `npm run commit` asks for the type, scope and summary and writes a valid
  message (commitizen). Plain `git commit` works too.
- A `commit-msg` hook checks every message against `commitlint.config.js`
  (the rules above). A `pre-commit` hook refuses scratch content: any file
  or folder under `content/` whose name starts with `tmp-` or `zz-tmp`.
  These are for trying out the site locally and are never published.
- The hooks are installed by `npm install` (husky), so they run inside the
  devcontainer. Committing from Windows outside the container skips them.
- CI repeats both checks on pull requests, for every commit and for the PR
  title.

## What the version means

- **Major**: the recipe format or URL structure changed in a breaking way.
- **Minor**: the site or book gained something.
- **Patch**: content only: recipes and wiki pages added or changed.

Housekeeping commits alone never cause a release.

## How releases happen

On every push to `main`, release-please updates an open "release" pull
request with the changelog so far. Merge it whenever you want to mark an
edition: that tags the version and creates a GitHub release. The site
itself deploys on every push regardless; releases are only the record.

To set a version by hand (for example 1.0.0 when the first real recipes
go live), add a footer to any commit:

    Release-As: 1.0.0
