# recipe-book

My recipes, kept as plain Markdown and published as a wiki-style website with a
flippable coil-bound book view.

Status: early setup. The dev environment, content layout and an empty Astro
site exist; recipe pages are not built yet.

## Commands

| Command           | What                                      |
| ----------------- | ----------------------------------------- |
| `npm run dev`     | Dev server at http://localhost:4321       |
| `npm run check`   | Type-check and validate                   |
| `npm run build`   | Build the static site into `dist/`        |
| `npm run preview` | Serve the built site                      |

## Getting started

1. Install Docker Desktop and the VS Code Dev Containers extension.
2. Open this folder in VS Code and choose **Reopen in Container**.
3. First time only: run `claude` in the terminal and log in. The login and all
   conversations are stored in a Docker volume, so they survive rebuilds.

## Where things are

| Path                    | What                                              |
| ----------------------- | ------------------------------------------------- |
| `content/`              | Recipes, ingredient pages, technique pages        |
| `templates/recipe.md`   | Starting point for a new recipe                   |
| `docs/recipe-format.md` | How a recipe file is written                      |
| `CLAUDE.md`             | Project context, decisions and roadmap            |
| `.devcontainer/`        | Dev environment                                   |

To add a recipe, see [content/README.md](content/README.md).
