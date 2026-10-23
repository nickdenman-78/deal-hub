/**
 * The toolbar's contents, as data rather than markup.
 *
 * This lives beside the editor rather than inside it because SimpleMarkdownEditor
 * now renders the same set of buttons in three places — the fixed bar, the bubble
 * menu over a selection, and the floating menu on an empty line. Three copies of
 * a v-for over hand-written button definitions is three chances for them to drift,
 * and the drift would be silent: a tool missing from one surface looks exactly
 * like a tool that was never meant to be there.
 *
 * Each spec closes over a getter for the editor rather than the editor itself.
 * Tiptap's `useEditor` returns a ref that is null for the first tick, so a spec
 * built eagerly against `editor.value` would capture null and stay dead.
 */
import type { Editor } from '@tiptap/core';

export type MarkdownHeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Which parts of markdown this instance can express.
 *
 * A disabled feature is removed from the SCHEMA, not just from the toolbar —
 * so it cannot be produced by a keyboard shortcut, by an input rule, or by
 * pasting content that contains it either.
 */
export interface MarkdownFeatures {
  bold: boolean;
  italic: boolean;
  strike: boolean;
  code: boolean;
  link: boolean;
  /** `false`, or the levels offered. */
  headings: false | MarkdownHeadingLevel[];
  bulletList: boolean;
  orderedList: boolean;
  blockquote: boolean;
  codeBlock: boolean;
  horizontalRule: boolean;
  /**
   * Undo/redo. `false` removes the history extension, so Ctrl+Z stops being
   * handled by the editor and falls through to the browser — which, inside a
   * contenteditable ProseMirror controls, does nothing useful. Turn it off only
   * for a field small enough that there is nothing to undo.
   */
  history: boolean;
}

/**
 * A toolbar entry.
 *
 * Spelled out rather than derived from `keyof MarkdownFeatures`, which is what
 * it used to be: headings are one feature and several buttons, undo and redo
 * are two buttons and one feature, and `divider` is a button that is not a
 * feature at all. The derived version quietly admitted `'history'` as a tool id
 * and rejected `'undo'`.
 */
export type MarkdownTool =
  | 'bold'
  | 'italic'
  | 'strike'
  | 'code'
  | 'link'
  | 'bulletList'
  | 'orderedList'
  | 'blockquote'
  | 'codeBlock'
  | 'horizontalRule'
  | `heading${MarkdownHeadingLevel}`
  | 'undo'
  | 'redo'
  | 'divider';

export const DEFAULT_FEATURES: MarkdownFeatures = {
  bold: true,
  italic: true,
  strike: false,
  code: true,
  link: true,
  headings: [2, 3],
  bulletList: true,
  orderedList: true,
  blockquote: true,
  codeBlock: false,
  horizontalRule: false,
  history: true,
};

/**
 * `toggle` reports state and carries `aria-pressed`; `action` just happens.
 *
 * The distinction is not cosmetic. Undo is never "on", so giving it
 * `aria-pressed="false"` forever would announce a toggle that cannot be
 * toggled. It gets `disabled` instead, which is the honest state and the one
 * that actually changes.
 */
export type MarkdownToolKind = 'toggle' | 'action' | 'separator';

export interface MarkdownToolSpec {
  id: MarkdownTool;
  kind: MarkdownToolKind;
  icon: string;
  title: string;
  run: () => void;
  active: () => boolean;
  disabled: () => boolean;
}

const NEVER = () => false;

/**
 * Whether a URL may become a link mark.
 *
 * Shared by the Link extension's `isAllowedUri` and by the link dialog, so the
 * dialog can refuse a bad URL with a message instead of accepting it and
 * letting the extension drop it silently — which looked, from the operator's
 * side, like the Save button not working.
 */
export function isAllowedLinkUri(uri: string, defaultProtocol = 'https'): boolean {
  try {
    const parsed = new URL(uri, `${defaultProtocol}://placeholder.invalid`);
    return ['http:', 'https:', 'mailto:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/** Every tool the given features allow, in the default order. */
export function buildTools(
  getEditor: () => Editor | undefined,
  features: MarkdownFeatures,
  onEditLink: () => void,
): MarkdownToolSpec[] {
  const specs: MarkdownToolSpec[] = [];
  const e = getEditor;

  const toggle = (id: MarkdownTool, icon: string, title: string, run: () => void, active: () => boolean) =>
    specs.push({ id, kind: 'toggle', icon, title, run, active, disabled: NEVER });

  const action = (id: MarkdownTool, icon: string, title: string, run: () => void, disabled: () => boolean) =>
    specs.push({ id, kind: 'action', icon, title, run, active: NEVER, disabled });

  if (features.history) {
    /*
     * `can()` runs the command against a throwaway transaction and reports
     * whether it would apply — so these disable themselves at the ends of the
     * history rather than doing nothing when pressed. It is re-read on every
     * transaction, which is also when the history depth changes.
     */
    action(
      'undo',
      'undo-2',
      'Undo (Ctrl+Z)',
      () => e()?.chain().focus().undo().run(),
      () => !e()?.can().undo(),
    );
    action(
      'redo',
      'redo-2',
      'Redo (Ctrl+Shift+Z)',
      () => e()?.chain().focus().redo().run(),
      () => !e()?.can().redo(),
    );
  }

  if (features.bold)
    toggle(
      'bold',
      'bold',
      'Bold (Ctrl+B)',
      () => e()?.chain().focus().toggleBold().run(),
      () => !!e()?.isActive('bold'),
    );
  if (features.italic)
    toggle(
      'italic',
      'italic',
      'Italic (Ctrl+I)',
      () => e()?.chain().focus().toggleItalic().run(),
      () => !!e()?.isActive('italic'),
    );
  if (features.strike)
    toggle(
      'strike',
      'strikethrough',
      'Strikethrough',
      () => e()?.chain().focus().toggleStrike().run(),
      () => !!e()?.isActive('strike'),
    );
  if (features.code)
    toggle(
      'code',
      'code',
      'Inline code',
      () => e()?.chain().focus().toggleCode().run(),
      () => !!e()?.isActive('code'),
    );

  const levels = features.headings === false ? [] : features.headings;
  for (const level of levels) {
    toggle(
      `heading${level}` as MarkdownTool,
      `heading-${level}`,
      `Heading ${level}`,
      () => e()?.chain().focus().toggleHeading({ level }).run(),
      () => !!e()?.isActive('heading', { level }),
    );
  }

  if (features.bulletList)
    toggle(
      'bulletList',
      'list',
      'Bulleted list',
      () => e()?.chain().focus().toggleBulletList().run(),
      () => !!e()?.isActive('bulletList'),
    );
  if (features.orderedList)
    toggle(
      'orderedList',
      'list-ordered',
      'Numbered list',
      () => e()?.chain().focus().toggleOrderedList().run(),
      () => !!e()?.isActive('orderedList'),
    );
  if (features.blockquote)
    toggle(
      'blockquote',
      'text-quote',
      'Quote',
      () => e()?.chain().focus().toggleBlockquote().run(),
      () => !!e()?.isActive('blockquote'),
    );
  if (features.codeBlock)
    toggle(
      'codeBlock',
      'square-code',
      'Code block',
      () => e()?.chain().focus().toggleCodeBlock().run(),
      () => !!e()?.isActive('codeBlock'),
    );
  if (features.horizontalRule)
    action('horizontalRule', 'minus', 'Horizontal rule', () => e()?.chain().focus().setHorizontalRule().run(), NEVER);

  // A toggle rather than an action: it reports whether the caret sits in a link,
  // which is what tells the operator the dialog will EDIT rather than create.
  if (features.link) toggle('link', 'link', 'Link (Ctrl+K)', onEditLink, () => !!e()?.isActive('link'));

  return specs;
}

const SEPARATOR: MarkdownToolSpec = {
  id: 'divider',
  kind: 'separator',
  icon: '',
  title: '',
  run: () => {},
  active: NEVER,
  disabled: NEVER,
};

/** The default bar order: history, then marks, then blocks, then the link. */
const DEFAULT_GROUPS: MarkdownTool[][] = [
  ['undo', 'redo'],
  ['bold', 'italic', 'strike', 'code'],
  ['heading1', 'heading2', 'heading3', 'heading4', 'heading5', 'heading6'],
  ['bulletList', 'orderedList', 'blockquote', 'codeBlock', 'horizontalRule'],
  ['link'],
];

/**
 * Pick and order the buttons.
 *
 * A tool the features disabled cannot be re-added by naming it: the node is not
 * in the schema, so the button would be dead. Filtering against `available`
 * rather than trusting the list keeps the two from disagreeing.
 */
export function selectTools(available: MarkdownToolSpec[], toolbar: boolean | MarkdownTool[]): MarkdownToolSpec[] {
  if (toolbar === false) return [];

  if (toolbar === true) {
    const out: MarkdownToolSpec[] = [];
    for (const group of DEFAULT_GROUPS) {
      const present = group
        .map((id) => available.find((tool) => tool.id === id))
        .filter((tool): tool is MarkdownToolSpec => tool !== undefined);
      if (present.length === 0) continue;
      if (out.length > 0) out.push(SEPARATOR);
      out.push(...present);
    }
    return out;
  }

  return toolbar
    .map((id) => (id === 'divider' ? SEPARATOR : available.find((tool) => tool.id === id)))
    .filter((tool): tool is MarkdownToolSpec => tool !== undefined);
}

/** Drop separators that ended up leading, trailing, or doubled. */
export function tidySeparators(tools: MarkdownToolSpec[]): MarkdownToolSpec[] {
  const out: MarkdownToolSpec[] = [];
  for (const tool of tools) {
    if (tool.kind !== 'separator') {
      out.push(tool);
      continue;
    }
    if (out.length === 0) continue;
    if (out[out.length - 1]?.kind === 'separator') continue;
    out.push(tool);
  }
  while (out.length > 0 && out[out.length - 1]?.kind === 'separator') out.pop();
  return out;
}
