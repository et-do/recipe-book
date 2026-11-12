# recipe-book

Ethan's personal recipe collection, published as a static wiki-style website
with an interactive coil-bound "recipe book" view.

## Current state

Roadmap item 1 done: Astro 7 (minimal template, strict TS) is scaffolded at
the root with `dev`, `build`, `preview`, `check` scripts; it renders a single
placeholder home page. Dev server host and polling are set in
`astro.config.mjs`. **No content collections, no recipes, no CI yet, and no
git remote.** The next step is item 2 of the roadmap below.

Update this section and the roadmap as work lands.

## What Ethan asked for

- A repo that is very well organised and obvious to add recipes to.
- A wiki site: clean layout, recipes linking to each other in-text.
- A flippable recipe book, classic coil-binder style, animated, centred in the
  viewport.
- Recipe pages built around a "Cooking for Engineers" style chart (ingredient
  rows, action cells spanning the rows they combine), plus whatever else is
  useful: ratios, substitutions, and so on.
- Metric weight for every ingredient where possible or sensible.
- Published by a workflow (GitHub Actions) to a website.
- Suggestions for improvements are welcome; propose them rather than silently
  adding scope.
- No placeholder recipes until he supplies real ones. His reference example is
  a brownie recipe; it is used as the worked example in `docs/recipe-format.md`
  but has deliberately not been added to `content/`.

## Layout

    .devcontainer/        dev environment
    content/              everything published; Markdown only, no code
      recipes/<category>/<slug>.md
      ingredients/<id>.md
      techniques/<slug>.md
    templates/recipe.md   copy this to start a recipe
    docs/recipe-format.md the recipe format (draft v0) - read before touching recipes
    src/, public/         site code (Astro)
    astro.config.mjs      Astro config

Keep content and code separate: the site reads `content/` from the repo root;
recipes never live under `src/`.

## Decisions so far

- **Stack: Astro (latest stable) at the repo root, TypeScript**, content
  collections using the `glob` loader pointed at `content/`, schema in Zod.
  Chosen because it is static, Markdown-native, and lets the flipbook be one
  interactive island on an otherwise zero-JS site. Scaffolded on Astro 7.4
  (TypeScript 6, `astro/tsconfigs/strict`).
- **Hosting: GitHub Pages via GitHub Actions** (assumed, not confirmed with
  Ethan; the repo has no remote yet).
- **Recipes are data.** Quantities and steps are structured frontmatter; the
  chart, ratios, scaling and the book pages are all generated from it.
- **Units:** grams first (liquids too), °C, cm, minutes. Spoon/count measures
  only as a secondary `alt`. See the Units section of the format doc.
- **Links:** `[[slug]]` wiki links; broken links fail the build.

## Roadmap

1. ~~Scaffold Astro at the root (minimal template, strict TS; `dev`, `build`,
   `preview`, `check` scripts).~~ Done.
2. Content collections + Zod schema for recipes / ingredients / techniques.
   Finalise `docs/recipe-format.md` to match what is implemented. Build-time
   validation of the step rules listed there.
3. Recipe chart component: turn `ingredients` + `steps` into the row-spanning
   table. This is the hardest and most important piece; get it right on a few
   differently shaped recipes (linear, sub-assembly, no-cook) before styling.
4. Wiki shell: home, category indexes, recipe / ingredient / technique pages,
   `[[wikilink]]` remark plugin, backlinks, tag pages, search (Pagefind).
5. Book view (`/book`): coil binder, CSS 3D page flip, keyboard / swipe / click,
   one recipe per spread, generated from the same data. Respect
   `prefers-reduced-motion`.
6. CI: on PR run check + build; on push to `main` build and deploy to Pages.
   Needs the GitHub remote and Pages enabled (ask Ethan).
7. First real recipes from Ethan.

Ideas already floated to Ethan (not yet approved, do not build unprompted):
servings scaler, baker's percentages, cook mode (large type, screen wake lock,
tick-off ingredients), print stylesheet for a real binder, per-recipe log of
tweaks, ingredient pages as the single home for substitutions and densities.

## Dev environment notes

- Work inside the devcontainer. Node is the current LTS; `gh` and `claude` are
  installed.
- Claude Code state lives in the `recipe-book-claude` Docker volume, mounted at
  `/home/vscode/.claude` with `CLAUDE_CONFIG_DIR` pointing at it. Conversations
  and login survive rebuilds. Do not delete that volume or change the mount
  target without telling Ethan.
- `node_modules` is a named volume too, so it is empty on the Windows host.
  `postCreateCommand` runs `npm install` once a `package.json` exists.
- The workspace is a Windows bind mount: file-change events do not reach the
  container, so `astro.config.mjs` sets `vite.server.watch.usePolling: true`.
- `astro.config.mjs` sets `server.host: true` so the forwarded port (4321) is
  reachable; no `--host` flag needed.
- Astro 7's `npm run dev` starts the server as a background process and
  returns. Use `npx astro dev logs` / `status` / `stop` to manage it.
- `gh auth login` is needed once per rebuild (git push itself works through
  VS Code's credential forwarding).
- Line endings are LF everywhere (`.gitattributes`, `.editorconfig`).

## Conventions

- Slugs and ids: kebab-case, permanent once published.
- Commit or push only when Ethan asks.
- Keep recipe text short and imperative.
