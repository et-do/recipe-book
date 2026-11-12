# Recipe format (draft v0)

Status: **design draft**. Nothing parses this yet. Finalise it when the schema
and the chart renderer are built, then keep this file as the reference.

A recipe is one Markdown file: structured YAML frontmatter (everything the site
needs to compute with) plus a short free-text body (everything a person needs
to read).

    content/recipes/<category>/<slug>.md

- `<category>` is just the subfolder name (`baking`, `mains`, `sauces`, ...).
  Create one when the first recipe needs it.
- `<slug>` is kebab-case and is the recipe's permanent id and URL.
- An optional photo sits next to it as `<slug>.jpg`.

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

## Frontmatter

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

### Step rules

- Each step acts on **the result of the previous step** plus whatever is in
  `use`. That one rule covers most recipes and keeps the list flat.
- `detail` is the small print under the action (time, temperature, cue).
- Sub-assemblies (a frosting, a marinade made separately): give the first step
  `start: true` so it does not inherit the previous result, give the last one an
  `id`, and reference that id in a later step's `use`.
- Every ingredient must be used exactly once. Ingredients a step combines must
  be adjacent rows, so order `ingredients` in the order they go in.
- The validator should fail the build on: unknown ids, unused ingredients,
  non-adjacent rows, missing units.

## Units

- **Mass in grams for everything that can be weighed**, including liquids,
  eggs and sticky things (honey, oil, milk).
- Amounts too small for a normal kitchen scale (under about 3 g) still get
  grams as `qty`, plus a spoon measure in `alt`.
- `alt` is also where "2 large", "1 shot", "1 tin" go.
- Temperatures in °C, lengths in cm, time in minutes.
- No cups, ounces or °F in source files. If imperial display is ever wanted,
  the site converts.
- Genuinely uncountable-by-weight things ("1 bay leaf", "salt to taste") use
  `unit: each` or `qty: null` with a `note`.

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
wiki pages. Ingredient pages are the home for general substitution and density
info, so recipes only carry what is specific to them.

## Derived on the site (never stored)

- Ratios / baker's percentages from `ratio_base`.
- Scaled quantities from `yield`.
- The chart, the ingredient checklist, and the book page.
