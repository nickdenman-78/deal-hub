/*
 * ProseMirror document → markdown.
 *
 * This is the OUTBOUND half of SimpleMarkdownEditor, and writing it by hand
 * rather than pulling in a markdown serializer is a deliberate security choice
 * as much as a weight one: the editor never emits an HTML string. Content goes
 * in as markdown, is parsed to a sanitised DOM by the existing renderer, lives
 * as a ProseMirror document constrained by a schema we control, and comes back
 * out as markdown built from the node tree. There is no path where author HTML
 * survives a round trip, because no step ever hands HTML onward.
 *
 * Pure and dependency-free, so the awkward parts — nesting, escaping, mark
 * ordering — are testable without mounting an editor.
 */

/** The subset of the ProseMirror JSON shape this serializer understands. */
export interface ProseMirrorMark {
  type: string;
  attrs?: Record<string, unknown>;
}

export interface ProseMirrorNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: ProseMirrorNode[];
  marks?: ProseMirrorMark[];
  text?: string;
}

/**
 * Characters that would otherwise be read back as markup.
 *
 * Deliberately narrow. Escaping every character the CommonMark spec allows an
 * escape for produces markdown full of backslashes that a human then has to
 * read — and this text is round-tripped through an editor operators also edit
 * by hand. These are the ones that actually change meaning mid-line.
 */
const INLINE_ESCAPE = /([\\`*_[\]])/g;

/**
 * Escapes at the START of a line only: these are block markers, harmless in the
 * middle of a sentence. Escaping "1." mid-sentence would mangle ordinary prose
 * like "see 1. above".
 */
const LINE_START_ESCAPE = /^(\s*)(#{1,6}\s|>\s?|[-+*]\s|\d+\.\s)/;

export function escapeMarkdown(text: string): string {
  return text.replace(INLINE_ESCAPE, '\\$1');
}

function escapeLineStarts(text: string): string {
  return text
    .split('\n')
    .map((line) => line.replace(LINE_START_ESCAPE, (_match, indent: string, marker: string) => `${indent}\\${marker}`))
    .join('\n');
}

/**
 * Wraps text in its marks.
 *
 * `code` is applied first and stops there: inside a code span nothing else is
 * markup, so emitting `**\`x\`**` would claim a bold that the renderer will not
 * produce. A link wraps everything else, because `[**text**](url)` is right and
 * `**[text](url)**` is a different tree.
 */
function applyMarks(text: string, marks: ProseMirrorMark[] | undefined): string {
  if (!marks || marks.length === 0) return escapeMarkdown(text);

  const has = (type: string) => marks.some((mark) => mark.type === type);

  if (has('code')) {
    // Backticks inside a code span are fenced by a longer run, per CommonMark —
    // escaping does not work in code spans.
    const longestRun = [...text.matchAll(/`+/g)].reduce((max, m) => Math.max(max, m[0].length), 0);
    const fence = '`'.repeat(longestRun + 1);
    const pad = text.startsWith('`') || text.endsWith('`') ? ' ' : '';
    let out = `${fence}${pad}${text}${pad}${fence}`;
    const link = marks.find((mark) => mark.type === 'link');
    if (link) out = linkify(out, link);
    return out;
  }

  let out = escapeMarkdown(text);
  if (has('bold')) out = `**${out}**`;
  if (has('italic')) out = `*${out}*`;
  if (has('strike')) out = `~~${out}~~`;

  const link = marks.find((mark) => mark.type === 'link');
  if (link) out = linkify(out, link);

  return out;
}

function linkify(label: string, mark: ProseMirrorMark): string {
  const href = typeof mark.attrs?.href === 'string' ? mark.attrs.href : '';
  if (!href) return label;
  // Parentheses in a bare destination would close the link early.
  const destination = /[()\s]/.test(href) ? `<${href}>` : href;
  return `[${label}](${destination})`;
}

function serializeInline(nodes: ProseMirrorNode[] | undefined): string {
  if (!nodes) return '';
  return nodes
    .map((node) => {
      if (node.type === 'hardBreak') {
        // Two trailing spaces is the portable hard break; a lone "\n" inside a
        // paragraph is only a line break when the renderer runs with
        // `breaks: true`, and ours deliberately does not.
        return '  \n';
      }
      if (node.type === 'text') return applyMarks(node.text ?? '', node.marks);
      // Anything else inline is not in our schema; take its text so content is
      // never silently dropped.
      return serializeInline(node.content);
    })
    .join('');
}

function prefixLines(text: string, first: string, rest: string): string {
  return text
    .split('\n')
    .map((line, index) => (index === 0 ? `${first}${line}` : `${rest}${line}`))
    .join('\n');
}

function serializeList(node: ProseMirrorNode, ordered: boolean): string {
  const start = ordered && typeof node.attrs?.start === 'number' ? node.attrs.start : 1;
  return (node.content ?? [])
    .map((item, index) => {
      const marker = ordered ? `${start + index}. ` : '- ';
      const indent = ' '.repeat(marker.length);
      const body = serializeBlocks(item.content, { tight: true });
      return prefixLines(body, marker, indent);
    })
    .join('\n');
}

interface BlockOptions {
  /** Inside a list item: single newline between blocks, not a blank line. */
  tight?: boolean;
}

function serializeBlocks(nodes: ProseMirrorNode[] | undefined, options: BlockOptions = {}): string {
  if (!nodes) return '';

  const parts = nodes
    .map((node) => {
      switch (node.type) {
        case 'paragraph':
          return escapeLineStarts(serializeInline(node.content));

        case 'heading': {
          const level = typeof node.attrs?.level === 'number' ? Math.min(6, Math.max(1, node.attrs.level)) : 1;
          return `${'#'.repeat(level)} ${serializeInline(node.content)}`;
        }

        case 'bulletList':
          return serializeList(node, false);

        case 'orderedList':
          return serializeList(node, true);

        case 'blockquote':
          // Blank lines inside a quote need their own ">" or the quote ends.
          return serializeBlocks(node.content)
            .split('\n')
            .map((line) => (line === '' ? '>' : `> ${line}`))
            .join('\n');

        case 'codeBlock': {
          const language = typeof node.attrs?.language === 'string' ? node.attrs.language : '';
          const body = (node.content ?? []).map((child) => child.text ?? '').join('');
          // A fence longer than any run inside, so a code block containing ```
          // does not terminate itself.
          const longest = [...body.matchAll(/`{3,}/g)].reduce((max, m) => Math.max(max, m[0].length), 2);
          const fence = '`'.repeat(longest + 1);
          return `${fence}${language}\n${body}\n${fence}`;
        }

        case 'horizontalRule':
          return '---';

        case 'listItem':
          return serializeBlocks(node.content, options);

        default:
          // Unknown block: keep its text rather than dropping content.
          return serializeBlocks(node.content, options) || serializeInline(node.content);
      }
    })
    .filter((part) => part !== '');

  return parts.join(options.tight ? '\n' : '\n\n');
}

/**
 * Serializes a ProseMirror document to markdown.
 *
 * Returns '' for an empty document — Tiptap represents "empty" as a single
 * empty paragraph, and a caller storing that as " " rather than "" would make
 * every untouched field look dirty.
 */
export function serializeToMarkdown(doc: ProseMirrorNode | null | undefined): string {
  if (!doc?.content) return '';
  return serializeBlocks(doc.content).trim();
}
