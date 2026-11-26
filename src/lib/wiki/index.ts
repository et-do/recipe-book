/**
 * The wiki's page index, read straight from content/ on disk so it works in
 * remark plugins (which run before collections are queryable) as well as in
 * pages. Small enough to rescan on every call, which keeps dev in sync.
 *
 * Slugs are unique across recipes, ingredients and techniques, so `[[slug]]`
 * needs no prefix.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parse } from 'yaml';

export type PageKind = 'recipe' | 'ingredient' | 'technique';

export interface PageRef {
  slug: string;
  kind: PageKind;
  title: string;
  url: string;
  /** Repo-relative path, for error messages. */
  file: string;
}

export const contentRoot = () => join(process.cwd(), 'content');

const BASE: Record<PageKind, string> = {
  recipe: '/recipes/',
  ingredient: '/ingredients/',
  technique: '/techniques/',
};

export function pageUrl(kind: PageKind, slug: string): string {
  return `${BASE[kind]}${slug}/`;
}

function markdownFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => join(dir, f));
}

function readTitle(file: string, fallback: string): string {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(readFileSync(file, 'utf8'));
  try {
    const data: unknown = match ? parse(match[1]!) : null;
    if (data && typeof data === 'object' && 'title' in data && typeof data.title === 'string') return data.title;
  } catch {
    // Bad YAML is reported by the collection schema; don't mask it here.
  }
  return fallback;
}

export function scanContent(root = contentRoot()): Map<string, PageRef> {
  const files: [PageKind, string][] = [];
  const recipes = join(root, 'recipes');
  if (existsSync(recipes)) {
    for (const category of readdirSync(recipes)) {
      const dir = join(recipes, category);
      if (statSync(dir).isDirectory()) files.push(...markdownFiles(dir).map((f) => ['recipe', f] as [PageKind, string]));
    }
  }
  files.push(...markdownFiles(join(root, 'ingredients')).map((f) => ['ingredient', f] as [PageKind, string]));
  files.push(...markdownFiles(join(root, 'techniques')).map((f) => ['technique', f] as [PageKind, string]));

  const index = new Map<string, PageRef>();
  for (const [kind, path] of files) {
    const slug = path.split(/[\\/]/).pop()!.replace(/\.md$/, '');
    const file = relative(process.cwd(), path);
    const existing = index.get(slug);
    if (existing) {
      throw new Error(
        `slug "${slug}" is used by both ${existing.file} and ${file}; ` +
          'slugs must be unique across recipes, ingredients and techniques',
      );
    }
    index.set(slug, { slug, kind, title: readTitle(path, slug), url: pageUrl(kind, slug), file });
  }
  return index;
}

/** `[[slug]]` or `[[slug|text]]`. */
export const WIKILINK = /\[\[([^\]|]+?)(?:\|([^\]]+?))?\]\]/g;

export function resolveLink(index: Map<string, PageRef>, slug: string, where: string): PageRef {
  const page = index.get(slug.trim());
  if (!page) throw new Error(`broken wiki link [[${slug}]] in ${where}: no recipe, ingredient or technique has that slug`);
  return page;
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Plain frontmatter text (step notes, details) to HTML with wiki links resolved. */
export function wikilinksToHtml(text: string, index: Map<string, PageRef>, where: string): string {
  let html = '';
  let last = 0;
  for (const m of text.matchAll(WIKILINK)) {
    const page = resolveLink(index, m[1]!, where);
    html += escapeHtml(text.slice(last, m.index));
    html += `<a class="wikilink" href="${page.url}">${escapeHtml(m[2]?.trim() ?? page.title)}</a>`;
    last = m.index + m[0].length;
  }
  return html + escapeHtml(text.slice(last));
}

/** Slugs linked from a piece of text. */
export function linkedSlugs(text: string): string[] {
  return [...text.matchAll(WIKILINK)].map((m) => m[1]!.trim());
}
