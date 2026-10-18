// Sanitised markdown→HTML renderer used by the metadata description editor (Preview tab),
// DescriptionPanel, and DescriptionExcerpt. The contract is "trusted markdown, defensive
// renderer": admin users are pre-authorised but a stray `<script>` from a copy-paste should
// never execute, and unexpected HTML in the source should be stripped rather than passed
// through. Raw HTML in the source is disabled at the parser; the DOMPurify pass scrubs the
// rendered output against a strict allow-list. Links get `target="_blank" rel="noopener
// noreferrer"` so external destinations don't share the admin tab.

import MarkdownIt from 'markdown-it';
import DOMPurify from 'dompurify';

const md = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: false,
  typographer: false,
});

// Add target="_blank" rel="noopener noreferrer" to every <a> token. Has to be a post-render
// override because markdown-it's default link renderer emits naked <a> tags.
const defaultLinkOpen =
  md.renderer.rules.link_open ?? ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options));

md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  const token = tokens[idx];
  const targetIdx = token.attrIndex('target');
  if (targetIdx < 0) {
    token.attrPush(['target', '_blank']);
  } else {
    token.attrs![targetIdx][1] = '_blank';
  }
  const relIdx = token.attrIndex('rel');
  if (relIdx < 0) {
    token.attrPush(['rel', 'noopener noreferrer']);
  } else {
    token.attrs![relIdx][1] = 'noopener noreferrer';
  }
  return defaultLinkOpen(tokens, idx, options, env, self);
};

const ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'em',
  'code',
  'pre',
  'blockquote',
  'ul',
  'ol',
  'li',
  'a',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
];

const ALLOWED_ATTR = ['href', 'target', 'rel', 'title'];

export function renderMarkdownToHtml(source: string | null | undefined): string {
  if (!source) {
    return '';
  }
  const rendered = md.render(source);
  return DOMPurify.sanitize(rendered, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ADD_ATTR: ['target'],
    USE_PROFILES: { html: true },
  });
}

// Plain-text excerpt for listing cards: strips markdown syntax, collapses whitespace, then
// truncates with an ellipsis. Falls back to empty string for null/undefined input so callers
// don't need their own guards.
export function plainTextExcerpt(source: string | null | undefined, maxChars = 120): string {
  if (!source) {
    return '';
  }
  // Quick-and-dirty: strip markdown syntax via the renderer then take the text content via a
  // temp element. Avoids pulling in a separate markdown-to-text package.
  const html = md.render(source);
  const tmp = document.createElement('div');
  tmp.innerHTML = DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR });
  const text = (tmp.textContent ?? '').replace(/\s+/g, ' ').trim();
  if (text.length <= maxChars) {
    return text;
  }
  return text.slice(0, maxChars - 1).trimEnd() + '…';
}
