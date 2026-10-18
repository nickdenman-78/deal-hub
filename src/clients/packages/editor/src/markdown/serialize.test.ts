import { describe, expect, it } from 'vitest';
import { renderMarkdownToHtml } from './render';
import { escapeMarkdown, serializeToMarkdown, type ProseMirrorNode } from './serialize';

const doc = (...content: ProseMirrorNode[]): ProseMirrorNode => ({ type: 'doc', content });
const text = (value: string, ...marks: string[]): ProseMirrorNode => ({
  type: 'text',
  text: value,
  ...(marks.length ? { marks: marks.map((type) => ({ type })) } : {}),
});
const para = (...content: ProseMirrorNode[]): ProseMirrorNode => ({ type: 'paragraph', content });

describe('serializeToMarkdown', () => {
  it('is empty for an empty document', () => {
    // Tiptap represents "empty" as one empty paragraph; storing that as
    // whitespace would make every untouched field look dirty.
    expect(serializeToMarkdown(doc({ type: 'paragraph' }))).toBe('');
    expect(serializeToMarkdown(null)).toBe('');
    expect(serializeToMarkdown(undefined)).toBe('');
  });

  it('separates blocks with a blank line', () => {
    expect(serializeToMarkdown(doc(para(text('One')), para(text('Two'))))).toBe('One\n\nTwo');
  });

  it('writes headings, quotes, rules and code blocks', () => {
    expect(serializeToMarkdown(doc({ type: 'heading', attrs: { level: 3 }, content: [text('Title')] }))).toBe(
      '### Title',
    );
    expect(serializeToMarkdown(doc({ type: 'horizontalRule' }))).toBe('---');
    expect(serializeToMarkdown(doc({ type: 'blockquote', content: [para(text('Quoted'))] }))).toBe('> Quoted');
    expect(
      serializeToMarkdown(
        doc({ type: 'codeBlock', attrs: { language: 'json' }, content: [{ type: 'text', text: '{"a":1}' }] }),
      ),
    ).toBe('```json\n{"a":1}\n```');
  });

  it('clamps a heading level into 1–6 rather than emitting nine hashes', () => {
    // Seven or more hashes is not a heading in CommonMark, it is literal text.
    expect(serializeToMarkdown(doc({ type: 'heading', attrs: { level: 9 }, content: [text('X')] }))).toBe('###### X');
    expect(serializeToMarkdown(doc({ type: 'heading', attrs: { level: 0 }, content: [text('X')] }))).toBe('# X');
  });

  it('keeps a blank line inside a blockquote quoted', () => {
    // Without the ">" on the empty line the quote ends there and the second
    // paragraph escapes it.
    expect(serializeToMarkdown(doc({ type: 'blockquote', content: [para(text('One')), para(text('Two'))] }))).toBe(
      '> One\n>\n> Two',
    );
  });

  describe('marks', () => {
    it('writes bold, italic and strike', () => {
      expect(serializeToMarkdown(doc(para(text('a', 'bold'))))).toBe('**a**');
      expect(serializeToMarkdown(doc(para(text('a', 'italic'))))).toBe('*a*');
      expect(serializeToMarkdown(doc(para(text('a', 'strike'))))).toBe('~~a~~');
      expect(serializeToMarkdown(doc(para(text('a', 'bold', 'italic'))))).toBe('***a***');
    });

    /* Inside a code span nothing else is markup, so claiming a bold the
       renderer will not produce would be a lie about the content. */
    it('does not wrap a code span in other marks', () => {
      expect(serializeToMarkdown(doc(para(text('x', 'code', 'bold'))))).toBe('`x`');
    });

    it('fences a code span containing backticks', () => {
      expect(serializeToMarkdown(doc(para(text('a ` b', 'code'))))).toBe('``a ` b``');
      expect(serializeToMarkdown(doc(para(text('`x`', 'code'))))).toBe('`` `x` ``');
    });

    it('puts the link outside the emphasis', () => {
      const link = { type: 'link', attrs: { href: 'https://example.invalid' } };
      const node: ProseMirrorNode = { type: 'text', text: 'a', marks: [{ type: 'bold' }, link] };
      expect(serializeToMarkdown(doc(para(node)))).toBe('[**a**](https://example.invalid)');
    });

    it('angle-brackets a destination containing spaces or parentheses', () => {
      const node: ProseMirrorNode = {
        type: 'text',
        text: 'a',
        marks: [{ type: 'link', attrs: { href: 'https://example.invalid/a(b)' } }],
      };
      expect(serializeToMarkdown(doc(para(node)))).toBe('[a](<https://example.invalid/a(b)>)');
    });
  });

  describe('lists', () => {
    const item = (...content: ProseMirrorNode[]): ProseMirrorNode => ({ type: 'listItem', content });

    it('writes bullet and ordered lists', () => {
      expect(
        serializeToMarkdown(doc({ type: 'bulletList', content: [item(para(text('a'))), item(para(text('b')))] })),
      ).toBe('- a\n- b');
      expect(
        serializeToMarkdown(doc({ type: 'orderedList', content: [item(para(text('a'))), item(para(text('b')))] })),
      ).toBe('1. a\n2. b');
    });

    it('honours an ordered list start', () => {
      expect(
        serializeToMarkdown(doc({ type: 'orderedList', attrs: { start: 5 }, content: [item(para(text('a')))] })),
      ).toBe('5. a');
    });

    it('indents a nested list under its parent marker', () => {
      const nested = doc({
        type: 'bulletList',
        content: [item(para(text('a')), { type: 'bulletList', content: [item(para(text('b')))] })],
      });
      expect(serializeToMarkdown(nested)).toBe('- a\n  - b');
    });
  });

  describe('escaping', () => {
    it('escapes inline markup so literal text survives', () => {
      expect(escapeMarkdown('*not bold*')).toBe('\\*not bold\\*');
      expect(escapeMarkdown('a_b_c')).toBe('a\\_b\\_c');
      expect(escapeMarkdown('[link]')).toBe('\\[link\\]');
      expect(escapeMarkdown('back\\slash')).toBe('back\\\\slash');
    });

    /* A paragraph that happens to begin "# " is text, not a heading — but only
       at the start of a line, or ordinary prose like "see 1. above" gets
       mangled. */
    it('escapes block markers at the start of a line only', () => {
      expect(serializeToMarkdown(doc(para(text('# not a heading'))))).toBe('\\# not a heading');
      expect(serializeToMarkdown(doc(para(text('- not a list'))))).toBe('\\- not a list');
      expect(serializeToMarkdown(doc(para(text('1. not a list'))))).toBe('\\1. not a list');
      expect(serializeToMarkdown(doc(para(text('see 1. above'))))).toBe('see 1. above');
    });

    it('round-trips literal markup back to the same text', () => {
      const literal = '*not bold* and _not italic_';
      const markdown = serializeToMarkdown(doc(para(text(literal))));
      const html = renderMarkdownToHtml(markdown);
      expect(html).not.toContain('<em>');
      expect(html).not.toContain('<strong>');
      expect(html).toContain('*not bold* and _not italic_');
    });
  });

  describe('the output is markdown, never HTML', () => {
    /*
     * The security property. Text is only ever escaped and wrapped in markdown
     * punctuation — no branch emits a tag — so author content cannot leave here
     * as markup, whatever it contains.
     */
    it('treats tag-shaped text as text', () => {
      const markdown = serializeToMarkdown(doc(para(text('<script>alert(1)</script>'))));
      expect(markdown).toBe('<script>alert(1)</script>');

      // And the renderer on the other side neutralises it, as it always has.
      expect(renderMarkdownToHtml(markdown)).not.toContain('<script>');
    });

    it('does not let a code block escape its own fence', () => {
      const md = serializeToMarkdown(
        doc({ type: 'codeBlock', content: [{ type: 'text', text: '```\nnot the end\n```' }] }),
      );
      expect(md.startsWith('````')).toBe(true);
      expect(md.endsWith('````')).toBe(true);
    });
  });
});
