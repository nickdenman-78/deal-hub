/**
 * Shared ABN / ACN helpers for AbnAcnInput — digit extraction and paste
 * kind detection (length only; checksum still runs on blur).
 */
import { ABN_MAX_DIGITS } from './abn';
import { ACN_MAX_DIGITS } from './acn';

export type AbnAcnKind = 'abn' | 'acn';

/** Digits only, capped. Spaces and other punctuation from typing/paste are dropped. */
export function digitsOnly(raw: string, max: number): string {
  return (raw ?? '').replace(/\D+/g, '').slice(0, max);
}

/**
 * Infer kind from a pasted (or otherwise complete) value.
 * 11 digits → ABN, 9 digits → ACN. Anything else leaves kind alone.
 */
export function detectAbnAcnKind(raw: string): AbnAcnKind | undefined {
  const digits = digitsOnly(raw, Math.max(ABN_MAX_DIGITS, ACN_MAX_DIGITS));
  if (digits.length === ABN_MAX_DIGITS) return 'abn';
  if (digits.length === ACN_MAX_DIGITS) return 'acn';
  return undefined;
}

export function maxDigitsForKind(kind: AbnAcnKind): number {
  return kind === 'acn' ? ACN_MAX_DIGITS : ABN_MAX_DIGITS;
}
