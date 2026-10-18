/*
 * Free-text tag handling — splitting pasted text, normalising, deduping. Pure,
 * so the rules live in one place instead of being re-improvised in each
 * component that happens to show chips.
 */

export interface TagRules {
  /** Compare case-insensitively when deduping. Storage keeps what was typed. */
  caseInsensitive?: boolean;
  /** Fold to lower case on the way in. Implies case-insensitive matching. */
  lowercase?: boolean;
  maxLength?: number;
  /** Tags must match this. Anything else is refused with `patternMessage`. */
  pattern?: RegExp;
  patternMessage?: string;
}

/*
 * What ends a tag when text is pasted or typed.
 *
 * Comma, semicolon, newline and tab — the shapes a list arrives in from a
 * spreadsheet cell, a YAML line or another field. NOT space: tags with spaces
 * in them are ordinary ("east coast", "needs review"), and splitting on space
 * would shred them into nonsense with no way to type the original.
 */
const SEPARATORS = /[,;\n\r\t]+/;

export function splitTags(raw: string): string[] {
  return raw
    .split(SEPARATORS)
    .map((part) => part.trim())
    .filter((part) => part !== '');
}

/** The stored form of a tag: trimmed, inner whitespace collapsed, optionally folded. */
export function normalizeTag(raw: string, rules?: TagRules): string {
  const collapsed = raw.trim().replace(/\s+/g, ' ');
  return rules?.lowercase === true ? collapsed.toLowerCase() : collapsed;
}

/** The form two tags are compared in. Never stored — only used to decide sameness. */
function comparable(tag: string, rules?: TagRules): string {
  return rules?.caseInsensitive === true || rules?.lowercase === true ? tag.toLowerCase() : tag;
}

export function containsTag(tags: readonly string[], candidate: string, rules?: TagRules): boolean {
  const needle = comparable(normalizeTag(candidate, rules), rules);
  return tags.some((tag) => comparable(tag, rules) === needle);
}

/** Why a tag cannot be added, or undefined if it can. */
export function tagError(raw: string, existing: readonly string[], rules?: TagRules): string | undefined {
  const tag = normalizeTag(raw, rules);
  if (tag === '') return undefined; // Nothing typed is not an error, just nothing to add.
  if (rules?.maxLength !== undefined && tag.length > rules.maxLength) {
    return `Keep it to ${rules.maxLength} characters.`;
  }
  if (rules?.pattern !== undefined && !rules.pattern.test(tag)) {
    return rules.patternMessage ?? 'That is not an allowed value.';
  }
  if (containsTag(existing, tag, rules)) return 'Already added.';
  return undefined;
}

export interface AddTagsResult {
  tags: string[];
  added: string[];
  /** Refused, with the reason — so a paste of thirty can report the four that failed. */
  rejected: { tag: string; reason: string }[];
}

/**
 * Adds one or many tags, applying the rules to each.
 *
 * Returns a NEW array rather than mutating, and reports what happened to every
 * candidate. Pasting a column from a spreadsheet is the normal case, and
 * silently dropping the duplicates in it looks identical to the paste not
 * working.
 */
export function addTags(
  existing: readonly string[],
  input: string | readonly string[],
  rules?: TagRules,
): AddTagsResult {
  const candidates = typeof input === 'string' ? splitTags(input) : input.flatMap((item) => splitTags(item));
  const tags = [...existing];
  const added: string[] = [];
  const rejected: { tag: string; reason: string }[] = [];

  for (const candidate of candidates) {
    const tag = normalizeTag(candidate, rules);
    if (tag === '') continue;
    // Checked against the growing list, so a paste containing the same tag
    // twice adds it once.
    const reason = tagError(tag, tags, rules);
    if (reason !== undefined) {
      rejected.push({ tag, reason });
      continue;
    }
    tags.push(tag);
    added.push(tag);
  }

  return { tags, added, rejected };
}

export function removeTag(existing: readonly string[], tag: string, rules?: TagRules): string[] {
  const needle = comparable(tag, rules);
  return existing.filter((item) => comparable(item, rules) !== needle);
}
