import source from './Button.vue?raw';
import { describe, expect, it } from 'vitest';

// jsdom does not animate CSS; pin the declarations required for a rotating ring.

describe('Button loading animation', () => {
  it('gives the inline spinner a transformable box and continuous rotation', () => {
    const spinner = source.match(/\.r-btn__spinner \{([^}]+)\}/)?.[1];
    expect(spinner).toContain('display: inline-block;');
    expect(spinner).toContain('width: 1em;');
    expect(spinner).toContain('height: 1em;');
    expect(spinner).toContain('animation: r-btn-spin 620ms linear infinite;');
    expect(source).toContain('transform: rotate(360deg);');
  });

  it('keeps a pulsing busy indicator under reduced motion instead of freezing', () => {
    expect(source).toMatch(
      /@media \(prefers-reduced-motion: reduce\) \{\s*\.r-btn__spinner \{\s*animation: r-btn-pulse 1\.4s ease-in-out infinite !important;/,
    );
    expect(source).toContain('@keyframes r-btn-pulse');
  });

  it('centres the spinner over the hidden content and keeps a busy button undimmed', () => {
    expect(source).toMatch(/\.r-btn \{\s*position: relative;/);
    expect(source).toMatch(
      /\.r-btn\[data-loading\] > \.r-btn__spinner \{\s*position: absolute;\s*inset: 0;\s*margin: auto;/,
    );
    expect(source).toMatch(
      /\.r-btn\[data-loading\]:disabled,\s*\.r-btn--busy:disabled \{\s*cursor: progress;\s*opacity: 1;/,
    );
  });

  it('declares the reduced-motion fallback at the top level, not inside the spin keyframes', () => {
    // Nested inside @keyframes the rules are invalid and silently dropped.
    expect(source).toMatch(/^@media \(prefers-reduced-motion: reduce\) \{/m);
    expect(source).toMatch(/^@keyframes r-btn-pulse \{/m);
    const spin = source.match(/@keyframes r-btn-spin \{([\s\S]*?)\n\}/)?.[1] ?? '';
    expect(spin).not.toContain('@media');
    expect(spin).not.toContain('@keyframes');
  });
});
