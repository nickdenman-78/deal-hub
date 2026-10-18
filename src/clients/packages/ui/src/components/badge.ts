/**
 * Badge label formatting — numbers honour `max` (`99+`), zero/empty hide.
 */

export function formatBadgeContent(content: string | number | null | undefined, max?: number): string | null {
  if (content === undefined || content === null || content === '') return null;

  if (typeof content === 'number' || (typeof content === 'string' && /^-?\d+$/.test(content.trim()))) {
    const n = Number(content);
    if (!Number.isFinite(n) || n === 0) return null;
    if (max !== undefined && n > max) return `${max}+`;
    return String(n);
  }

  return String(content);
}
