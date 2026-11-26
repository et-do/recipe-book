/**
 * Markdown plugins for content/ (Sätteri, Astro's default Markdown processor;
 * same mdast node shapes as remark):
 * - wikilinks: `[[slug]]` / `[[slug|text]]` become links; broken links fail
 *   the build.
 * - recipeSections: recipe bodies may only use the agreed `##` headings, so
 *   every recipe page is laid out the same way.
 */
import { relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { PhrasingContent } from 'mdast';
import type { MdastPluginDefinition } from 'satteri';
import { resolveLink, scanContent, WIKILINK } from './index';

const where = (url: URL | undefined) => (url ? relative(process.cwd(), fileURLToPath(url)) : 'Markdown');

export const wikilinks: MdastPluginDefinition = {
  name: 'wikilinks',
  text(node, ctx) {
    if (!node.value.includes('[[')) return;
    const index = scanContent();
    const parts: PhrasingContent[] = [];
    let last = 0;
    for (const m of node.value.matchAll(WIKILINK)) {
      const page = resolveLink(index, m[1]!, where(ctx.fileURL));
      if (m.index > last) parts.push({ type: 'text', value: node.value.slice(last, m.index) });
      parts.push({
        type: 'link',
        url: page.url,
        data: { hProperties: { className: ['wikilink'] } },
        children: [{ type: 'text', value: m[2]?.trim() ?? page.title }],
      });
      last = m.index + m[0].length;
    }
    if (parts.length === 0) return;
    if (last < node.value.length) parts.push({ type: 'text', value: node.value.slice(last) });
    ctx.replaceNode(node, parts);
  },
};

/** Allowed `##` headings in a recipe body, in their recommended order. */
export const RECIPE_SECTIONS = [
  'Notes',
  'Why it works',
  'Substitutions',
  'Variations',
  'Storage',
  'Serve with',
  'Log',
] as const;

export const recipeSections: MdastPluginDefinition = {
  name: 'recipe-sections',
  heading(node, ctx) {
    const file = where(ctx.fileURL);
    if (!/(^|[\\/])content[\\/]recipes[\\/]/.test(file)) return;
    const text = ctx.textContent(node).trim();
    if (node.depth === 1) {
      throw new Error(`${file}: don't use a "# ${text}" heading; the title comes from frontmatter`);
    }
    if (node.depth === 2 && !(RECIPE_SECTIONS as readonly string[]).includes(text)) {
      throw new Error(`${file}: unknown section "## ${text}". Recipe sections are: ${RECIPE_SECTIONS.join(', ')}`);
    }
  },
};
