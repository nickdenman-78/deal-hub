import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderMarkdownToHtml, plainTextExcerpt } from './render';

describe('renderMarkdownToHtml', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders bold markdown', () => {
    const html = renderMarkdownToHtml('hello **world**');
    expect(html).toContain('<strong>world</strong>');
  });

  it('escapes raw HTML from source (html: false) so scripts cannot execute', () => {
    const html = renderMarkdownToHtml('safe <script>alert(1)</script> text');
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('adds noopener noreferrer and target blank to links', () => {
    const html = renderMarkdownToHtml('[x](https://example.com)');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it('returns empty string for nullish input', () => {
    expect(renderMarkdownToHtml(null)).toBe('');
    expect(renderMarkdownToHtml(undefined)).toBe('');
    expect(renderMarkdownToHtml('')).toBe('');
  });
});

describe('plainTextExcerpt', () => {
  it('strips markdown and truncates', () => {
    const text = plainTextExcerpt('**hello** world '.repeat(20), 40);
    expect(text.endsWith('…')).toBe(true);
    expect(text.length).toBeLessThanOrEqual(40);
    expect(text).not.toContain('**');
  });

  it('returns empty for nullish', () => {
    expect(plainTextExcerpt(null)).toBe('');
  });
});
