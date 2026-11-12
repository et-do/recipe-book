# Recipe format (v1)

Status: **enforced.** The build checks every rule here
(`src/lib/recipe/schema.ts`, `src/lib/recipe/steps.ts`) and fails with a
message naming the file, field and step. Keep this file and the schema in
step.

A recipe is one Markdown file: structured YAML frontmatter (everything the site
needs to compute with) plus a short free-text body (everything a person needs
to read).

    content/recipes/<category>/<slug>.md

- `<category>` is just the subfolder name (`baking`, `mains`, `sauces`, ...).
  Create one when the first recipe needs it.
- `<slug>` is kebab-case and is the recipe's permanent id. The category folder
  is not part of the id, so a recipe can move category without breaking
  links. Two recipes with the same slug fail the build, even in different
  folders.
- An optional photo sits next to it as `<slug>.jpg` (not wired up yet).

## The recipe chart

The centrepiece of every recipe page is a chart in the "Cooking for Engineers"
style: ingredients are rows down the left, and each action is a cell spanning
the rows it combines, reading left to right in time.

    +--------------------------------------------------------------+
    | Butter and flour a 20 cm square pan                          |
    | Preheat oven to 175 °C                                       |
    +----------------------------+------+-----+-----+------+-------+
    | 115 g  unsalted butter     | melt |     |     |      |       |
    | 200 g  sugar               +------+ mix |     |      | bake  |
    | 2.5 g  vanilla extract     |      |     | mix | fold | 175°C |
    | 60 g   espresso            |      |     |     | in   | 30-40 |
    | 100 g  eggs (2 large)      +------+-----+     |      | min   |
    | 80 g   all-purpose flour   |                  |      |       |
    | 80 g   cocoa powder        |                  |      |       |
    | 1.3 g  baking soda         |                  |      |       |
    | 1.5 g  salt                |                  |      |       |
    +----------------------------+------------------+------+-------+

The chart is **generated** from `ingredients` + `steps`; nobody draws it by hand.
(The sketch above is rough; the site renders the real thing.)

## Frontmatter

Keys are checked strictly: a misspelt or unknown key fails the build.

```yaml
title: Brownies
description: One-line summary shown in listings and on the book page.
tags: [chocolate, dessert]
yield: { qty: 16, unit: pieces }      # what the scaler multiplies
time: { active: 15, total: 55 }       # minutes
equipment: [20 cm square pan]
ratio_base: flour                     # optional: ingredient id that is 100 %

prep:                                 # full-width rows at the top of the chart
  - Butter and flour a 20 cm square pan
  - Preheat oven to 175 °C

ingredients:                          # order = row order in the chart
  - id: butter                        # short handle used by steps
    item: unsalted butter             # display name; auto-links to
                                      #   content/ingredients/<id>.md if present
    qty: 115
    unit: g
  - id: eggs
    item: eggs
    qty: 100
    unit: g
    alt: 2 large                      # secondary measure, shown in grey
  - id: baking-soda
    item: baking soda
    qty: 1.3
    unit: g
    alt: ¼ tsp

steps:                                # chronological
  - do: melt
    use: [butter]
  - do: mix
    use: [sugar, vanilla, espresso]
  - do: mix
    use: [eggs]
  - do: fold in
    use: [flour, cocoa, baking-soda, salt]
  - do: bake
    detail: 175 °C · 30–40 min
```

| Field         | Required | Notes                                                 |
| ------------- | -------- | ----------------------------------------------------- |
| `title`       | yes      |                                                       |
| `description` | yes      | One line.                                             |
| `tags`        | no       | kebab-case.                                           |
| `yield`       | yes      | `{ qty, unit }`; `unit` is free text (pieces, jar).   |
| `time`        | yes      | `{ active, total }` whole minutes; total ≥ active.    |
| `equipment`   | no       | Free text.                                            |
| `ratio_base`  | no       | An ingredient id weighed in `g`.                      |
| `prep`        | no       | Free text, one line each.                             |
| `ingredients` | yes      | At least one. Fields below.                           |
| `steps`       | yes      | At least one. Fields below.                           |
| `credits`     | no       | Sources that inspired or informed it. Fields below.   |

Ingredient fields:

| Field  | Required          | Notes                                                       |
| ------ | ----------------- | ----------------------------------------------------------- |
| `id`   | yes               | kebab-case handle for steps; unique within the recipe.     |
| `item` | yes               | Display name.                                               |
| `qty`  | yes               | A positive number, or `null` for unmeasured.                |
| `unit` | if `qty` is set   | `g` or `each`. Nothing else.                                |
| `alt`  | no                | Secondary measure: `¼ tsp`, `2 large`.                      |
| `note` | if `qty` is null  | `to taste`, `for dusting`.                                  |
| `ref`  | no                | Ingredient page id when it differs from `id`, e.g. two lots of sugar: `id: sugar-glaze`, `ref: sugar`. |

Credit fields (a web page, a book, a person):

| Field   | Required | Notes                                                 |
| ------- | -------- | ----------------------------------------------------- |
| `title` | yes      | `Serious Eats: Fudgy Brownies`, `Grandma`.            |
| `url`   | no       | `http(s)://` only.                                    |
| `note`  | no       | What came from it: `base ratio`, `espresso idea`.     |

```yaml
credits:
  - title: Serious Eats - Fudgy Brownies
    url: https://www.seriouseats.com/...
    note: base ratio
  - title: Grandma
```

Step fields:

| Field    | Required | Notes                                                    |
| -------- | -------- | -------------------------------------------------------- |
| `do`     | yes      | The action, short: `melt`, `fold in`.                    |
| `use`    | no       | Ingredient ids and named step results added now.         |
| `detail` | no       | Small print under the action: time, temperature, cue.   |
| `start`  | no       | `true` begins a sub-assembly.                            |
| `id`     | no       | Names this step's result so a later step can `use` it.  |

### Step rules

- Each step acts on **the result of the previous step** plus whatever is in
  `use`. That one rule covers most recipes and keeps the list flat.
- Sub-assemblies (a frosting, a dry mix, a marinade made separately): give the
  step that finishes it an `id`, and reference that id in a later step's
  `use`. The step after a named one must have `start: true` (it begins
  something new). Example:

  ```yaml
  steps:
    - { do: sift, use: [flour, cocoa], id: dry }
    - { do: cream, use: [butter, sugar], start: true }
    - { do: fold in, use: [dry] }
  ```

The build fails if:

- an id in `use` is neither an ingredient nor a named step;
- an ingredient is never used, or used twice;
- a named result is never used, used twice, or used before it is made;
- `start: true` throws away an unnamed result;
- the last step has an `id` (the last step is the finished dish);
- a step acts on nothing (preheating and similar belong in `prep`);
- **a step's rows are not contiguous.** Everything a step contains so far
  must be one unbroken block of rows, or the chart cannot be drawn. Order
  `ingredients` in the order they go in, keeping each sub-assembly's
  ingredients together.

## Units

- **Mass in grams for everything that can be weighed**, including liquids,
  eggs and sticky things (honey, oil, milk).
- Amounts too small for a normal kitchen scale (under about 3 g) still get
  grams as `qty`, plus a spoon measure in `alt`.
- `alt` is also where "2 large", "1 shot", "1 tin" go.
- Temperatures in °C, lengths in cm, time in minutes.
- No cups, ounces or °F in source files. If imperial display is ever wanted,
  the site converts.
- Genuinely uncountable-by-weight things use `unit: each` ("1 bay leaf") or
  `qty: null` with a `note` ("salt, to taste").

## Body

Plain Markdown under the frontmatter. All sections are optional; use these
headings so the site can place them consistently:

```markdown
## Notes
What matters, what to look for, what goes wrong.

## Substitutions
- **Espresso** → 60 g strong coffee, or 60 g water + 3 g instant espresso.

## Variations
Changes that make it a different thing worth naming.

## Log
- 2026-11-12: 35 min was right in the glass pan.
```

## Links

Wiki-style, by slug, across recipes, ingredients and techniques:

    [[brown-butter]]                  link text = target's title
    [[brown-butter|browned butter]]   custom link text

Broken links should fail the build. Each page lists its backlinks ("used in").

`content/ingredients/<id>.md` and `content/techniques/<slug>.md` are ordinary
wiki pages. Their frontmatter is `title` (required), `description` and
`tags` (optional). Ingredient pages are the home for general substitution and density
info, so recipes only carry what is specific to them.

## Derived on the site (never stored)

- Ratios / baker's percentages from `ratio_base`.
- Scaled quantities from `yield`.
- The chart, the ingredient checklist, and the book page.
