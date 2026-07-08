// Shared markdown-it instance for rendering report content. Reports are our own
// authored, trusted markdown (bundled at build time from src/reports/content),
// so HTML passthrough stays disabled and we lean on markdown-it's built-in
// tables/linkify. Headings get slug anchors so the in-page table of contents can
// deep-link to sections.

import MarkdownIt from 'markdown-it';
import anchor from 'markdown-it-anchor';

const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
}).use(anchor, {
  slugify,
  permalink: anchor.permalink.headerLink(),
});

/** Kebab-case slug from heading text, used for #anchors and the TOC. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function renderMarkdown(source: string): string {
  return md.render(source);
}

export interface TocEntry {
  level: number;
  text: string;
  slug: string;
}

/** Top-level (##) headings for the sidebar table of contents. */
export function extractToc(source: string): TocEntry[] {
  const entries: TocEntry[] = [];
  for (const line of source.split('\n')) {
    const match = /^(#{2,3})\s+(.*)$/.exec(line.trim());
    if (!match) continue;
    const text = match[2].replace(/[*_`]/g, '').trim();
    entries.push({ level: match[1].length, text, slug: slugify(text) });
  }
  return entries;
}
