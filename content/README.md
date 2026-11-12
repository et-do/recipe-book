# Content

Everything the site publishes lives here. No code.

| Folder         | What goes in it                                   | Path                              |
| -------------- | ------------------------------------------------- | --------------------------------- |
| `recipes/`     | One file per recipe, grouped by category folder   | `recipes/<category>/<slug>.md`    |
| `ingredients/` | Wiki pages: what it is, substitutes, density      | `ingredients/<id>.md`             |
| `techniques/`  | Wiki pages: methods that several recipes share    | `techniques/<slug>.md`            |

## Adding a recipe

1. Copy [`templates/recipe.md`](../templates/recipe.md) to
   `recipes/<category>/<slug>.md` (make the category folder if it is new).
2. Fill it in. Grams wherever possible. Format reference:
   [`docs/recipe-format.md`](../docs/recipe-format.md).
3. Link to other pages with `[[slug]]`.
