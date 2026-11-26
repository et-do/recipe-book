# recipe-book

Ethan's personal recipe collection, published as a static wiki-style website
with an interactive coil-bound "recipe book" view.

## Current state

Roadmap items 1, 2, 3 and 6 are done. Astro 7 (strict TS) at the root, live
at https://recipes.ethan-domokos.ca, deployed by GitHub Actions. Content
collections and the recipe schema validate everything in
`docs/recipe-format.md` (v1) at build time. The chart component exists and
is previewed on test fixtures at `/dev/charts` (dev server only); Ethan has
not yet reviewed it visually. Logic is unit tested with Vitest (`npm test`).
The published site is still a single placeholder page, and `content/` is
empty, so the build logs "No files found" warnings; those are expected. The
next step is item 4 of the roadmap below.

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
    docs/recipe-format.md the recipe format (v1, enforced) - read before touching recipes
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
- **Hosting: GitHub Pages via GitHub Actions**, repo `et-do/recipe-book`,
  served at https://recipes.ethan-domokos.ca (CNAME `recipes` →
  `et-do.github.io` in Squarespace DNS; custom domain set in repo Pages
  settings, so no `public/CNAME` file is needed). The apex domain is a
  separate GitHub Pages site; do not touch its records.
- **Recipes are data.** Quantities and steps are structured frontmatter; the
  chart, ratios, scaling and the book pages are all generated from it.
- **Units:** grams first (liquids too), °C, cm, minutes. Spoon/count measures
  only as a secondary `alt`. See the Units section of the format doc.
- **Links:** `[[slug]]` wiki links; broken links fail the build.

## Roadmap

1. ~~Scaffold Astro at the root (minimal template, strict TS; `dev`, `build`,
   `preview`, `check` scripts).~~ Done.
2. ~~Content collections + Zod schema; finalise `docs/recipe-format.md`;
   build-time step validation.~~ Done. `src/content.config.ts`,
   `src/lib/recipe/schema.ts` (Zod, strict objects), `src/lib/recipe/steps.ts`
   (step analysis: issues + each step's row span and inputs). Entry id =
   file name; category = recipe's folder (derive from `entry.filePath`).
   Duplicate slugs fail the build (`prerenderConflictBehavior: 'error'`).
   Added `ref` and `note` ingredient fields and a `credits` list (title, url,
   note) at Ethan's request (see format doc). Cross-collection checks (wiki
   links, slug uniqueness across collections, `ref` pointing at a real
   ingredient page) belong to item 4.
3. ~~Recipe chart component.~~ Done. `src/lib/recipe/chart.ts` lays out the
   grid (each step one column wide, placed just before the step that
   consumes it; blank gap from an ingredient to its first step);
   `src/components/RecipeChart.astro` renders it with basic styling.
   Fixtures for five shapes (linear, sub-assembly last, sub-assembly first,
   two sub-assemblies, no-cook) in `src/lib/recipe/fixtures.ts`, shared by
   tests and the dev-only `/dev/charts` page (injected by an inline
   integration in `astro.config.mjs` only for `astro dev`). Ingredient-page
   links in the chart and the credits display come with item 4.
4. Wiki shell: home, category indexes, recipe / ingredient / technique pages,
   `[[wikilink]]` remark plugin, backlinks, tag pages, search (Pagefind).
5. Book view (`/book`): coil binder, CSS 3D page flip, keyboard / swipe / click,
   one recipe per spread, generated from the same data. Respect
   `prefers-reduced-motion`.
6. ~~CI: on PR run check + build; on push to `main` build and deploy to
   Pages.~~ Done early (`.github/workflows/ci.yml`, `deploy.yml`). Add the
   Pagefind step to the build when search lands.
7. First real recipes from Ethan.

Ideas already floated to Ethan (not yet approved, do not build unprompted):
servings scaler, baker's percentages, cook mode (large type, screen wake lock,
tick-off ingredients), print stylesheet for a real binder, per-recipe log of
tweaks, ingredient pages as the single home for substitutions and densities.

## Dev environment notes

- Work inside the devcontainer. Node is the current LTS; `gh` and `claude` are
  installed.
- Claude Code state (conversations, login, memory) is bind-mounted from the
  Windows host folder `%USERPROFILE%\.devcontainer-state\recipe-book\claude`
  to `/home/vscode/.claude`, with `CLAUDE_CONFIG_DIR` pointing at it. Shell
  history sits next to it in `shell-history`. `initializeCommand` creates
  both folders. This used to be a named Docker volume, but a Docker Desktop
  update on 2026-11-26 wiped every named volume and all chat history. Never
  move Claude state back into a Docker volume, and never change or remove
  this mount without telling Ethan. The old `recipe-book-claude` and
  `recipe-book-shell-history` volumes are unused now and can be deleted.
- `node_modules` is a named volume (safe to lose: `npm install` restores it),
  so it is empty on the Windows host.
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
- Commit or push only when Ethan asks. Ethan runs commits himself; give him
  the commands. Conventional Commits with the cookbook types in
  `docs/commits.md` (`recipe`, `tweak`, `wiki`, `feat`, `fix`, plus hidden
  housekeeping types), 1-2 sentences, no co-author trailer.
- Releases: release-please (`release-please-config.json`,
  `.github/workflows/release.yml`) keeps a release PR with a recipe-focused
  changelog. Needs "Allow GitHub Actions to create and approve pull
  requests" enabled in the repo settings.
- Visual checks: with the dev server running,
  `npm run screenshot -- <path> <out.png> [width]` (Playwright + Chromium,
  installed by `postCreateCommand`). Put screenshots in the scratchpad, not
  the repo.
- Keep recipe text short and imperative.
