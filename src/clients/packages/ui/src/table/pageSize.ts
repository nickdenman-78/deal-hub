/**
 * Default rows-per-page choices for {@link Pagination}.
 * Individual tables override via `pageSizeOptions` / `allowCustomPageSize`.
 */
export const DEFAULT_PAGE_SIZE_OPTIONS: readonly number[] = [10, 15, 20, 25, 30, 40, 50, 100];

/** Accept a typed custom page size: integer ≥ 1. */
export function parsePageSize(raw: string | number | undefined | null): number | null {
  if (raw === undefined || raw === null || raw === '') return null;
  const n = typeof raw === 'number' ? raw : Number(String(raw).trim());
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 1) return null;
  return n;
}
