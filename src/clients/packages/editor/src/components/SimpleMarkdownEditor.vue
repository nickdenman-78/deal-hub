<script setup lang="ts">
/**
 * A what-you-see rich-text editor whose VALUE IS MARKDOWN, on Tiptap.
 *
 * The third member of this package's markdown family, and the distinction
 * matters when choosing:
 *
 *   MarkdownEditor  — Monaco. You edit markdown SOURCE. For operators who know
 *                     markdown and want to see exactly what is stored.
 *   MarkdownView    — read-only rendering of stored markdown.
 *   this            — formatting by toolbar and shortcut, no syntax on screen.
 *                     For description fields written by people who should not
 *                     have to learn markdown to write a sentence in bold.
 *
 * ── WHY THIS DOES NOT WIDEN THE INJECTION SURFACE ──────────────────────────
 *
 * The value never passes through an HTML string in either direction, and no
 * step trusts the one before it.
 *
 *   IN   markdown → renderMarkdownToHtml() → setContent()
 *        The renderer is the one this package already ships: markdown-it with
 *        `html: false`, so raw HTML in the source is not parsed as markup at
 *        all, followed by a DOMPurify pass against a strict tag allow-list. So
 *        the HTML Tiptap parses has already been sanitised — it is not author
 *        input, it is our own output.
 *
 *   HELD The ProseMirror SCHEMA is a second allow-list, and a stricter one.
 *        A document can only contain nodes and marks that are registered, so
 *        anything pasted from a web page — scripts, iframes, styles, event
 *        handlers, unknown tags — is dropped at parse time rather than
 *        filtered afterwards. Turning a feature off below removes its node
 *        from the schema, so it becomes unrepresentable, not merely hidden.
 *
 *   OUT  document → serializeToMarkdown()
 *        Walks the node tree and emits markdown punctuation. No branch emits a
 *        tag, so tag-shaped text stays text. See serialize.ts.
 *
 * Links are the one place a URL is author-controlled, so protocols are limited
 * to http/https/mailto — `javascript:`, `data:` and `vbscript:` are refused by
 * `isAllowedUri` below rather than left to the renderer to catch later.
 *
 * NOT included, deliberately: images (a URL the browser fetches, plus data:
 * URIs), raw HTML blocks, and tables. Each is a real feature and each wants its
 * own decision rather than arriving as a side effect of "add an editor".
 */
import { Link } from '@tiptap/extension-link';
import { CharacterCount, Placeholder } from '@tiptap/extensions';
import { StarterKit } from '@tiptap/starter-kit';
import type { Editor } from '@tiptap/core';
import type { EditorState } from '@tiptap/pm/state';
import type { EditorView } from '@tiptap/pm/view';
import { EditorContent, useEditor } from '@tiptap/vue-3';
import { computed, defineAsyncComponent, onBeforeUnmount, ref, useId, watch } from 'vue';
import { useEditorChrome } from '../chrome';
import { renderMarkdownToHtml } from '../markdown/render';
import { serializeToMarkdown, type ProseMirrorNode } from '../markdown/serialize';
import {
  DEFAULT_FEATURES,
  buildTools,
  isAllowedLinkUri,
  selectTools,
  tidySeparators,
  type MarkdownFeatures,
  type MarkdownTool,
  type MarkdownToolSpec,
} from '../markdown/tools';
import MarkdownLinkDialog from '../internal/MarkdownLinkDialog.vue';
import MarkdownToolbar from '../internal/MarkdownToolbar.vue';

export type { MarkdownFeatures, MarkdownHeadingLevel, MarkdownTool, MarkdownToolSpec } from '../markdown/tools';

/**
 * StarterKit ships TrailingNode, but it only inserts via `appendTransaction`.
 * Content that ends on a blockquote/list/heading therefore has no blank line
 * until the first user transaction — usually focus — and the control jumps
 * taller. Call this after mount and after external setContent so the blank
 * line is already in the layout. Empty trailing paragraphs are still dropped
 * by serializeToMarkdown, so the stored value is unchanged.
 */
function ensureTrailingParagraph(instance: Editor) {
  const { doc, schema } = instance.state;
  const last = doc.lastChild;
  if (!last || last.type.name === 'paragraph') return;
  const paragraph = schema.nodes.paragraph;
  if (!paragraph) return;
  instance.view.dispatch(instance.state.tr.insert(doc.content.size, paragraph.create()));
}
/** Where the buttons live. */
export type MarkdownMenuMode = 'toolbar' | 'inline';

/*
 * The inline menus are loaded ONLY when they are used, and that is the whole
 * reason they are async.
 *
 * `@tiptap/vue-3/menus` pulls in the bubble-menu and floating-menu extensions
 * and, through them, @floating-ui/dom. A static import would put all three in
 * the chunk of every consumer — including config-admin, which uses the fixed
 * toolbar and would pay for a positioning engine it never runs. The package's
 * whole shape is this argument applied to Monaco; the same rule applies here.
 */
const BubbleMenu = defineAsyncComponent(() => import('@tiptap/vue-3/menus').then((m) => m.BubbleMenu));
const FloatingMenu = defineAsyncComponent(() => import('@tiptap/vue-3/menus').then((m) => m.FloatingMenu));

const props = withDefaults(
  defineProps<{
    label?: string;
    description?: string;
    placeholder?: string;
    disabled?: boolean;
    readonly?: boolean;
    /** Partial: anything omitted keeps its default. */
    features?: Partial<MarkdownFeatures>;
    /**
     * WHICH buttons: `false` hides them entirely, an array picks and orders
     * them (`'divider'` inserts a separator). `menu` decides where they appear.
     */
    toolbar?: boolean | MarkdownTool[];
    /**
     * WHERE the buttons appear.
     *
     *   toolbar — a fixed strip above the text. Always visible, so an operator
     *             who does not know the field is rich text can see that it is.
     *   inline  — nothing until you need it: a bubble menu over a selection,
     *             and a floating menu on an empty line. Right for a dense form
     *             where a permanent strip on every field is noise.
     */
    menu?: MarkdownMenuMode;
    minHeight?: string;
    maxHeight?: string;
    /** Characters, counted on the TEXT rather than the markup. */
    maxLength?: number;
    /** Show the live character count. Implied by maxLength. */
    showCount?: boolean;
    /** Marks the field as operator-editable, painting the Stanwell tint. */
    editable?: boolean;
    /**
     * Strip formatting from pasted content, keeping only text.
     *
     * The schema already discards anything it does not model, so this is not a
     * safety switch — it is for fields where inheriting a web page's heading
     * structure is simply unwanted.
     */
    pastePlainText?: boolean;
  }>(),
  {
    label: undefined,
    description: undefined,
    placeholder: undefined,
    features: undefined,
    toolbar: true,
    menu: 'toolbar',
    minHeight: '9rem',
    maxHeight: undefined,
    maxLength: undefined,
    showCount: false,
  },
);

const model = defineModel<string | undefined>();

const chrome = useEditorChrome();
const fieldId = useId();
const describedBy = `${fieldId}-hint`;

const features = computed<MarkdownFeatures>(() => ({ ...DEFAULT_FEATURES, ...props.features }));
const isEditable = computed(() => !props.disabled && !props.readonly);

/* CSS v-bind targets — `none` rather than undefined so the property stays valid. */
const minHeightCss = computed(() => props.minHeight);
const maxHeightCss = computed(() => props.maxHeight ?? 'none');

/*
 * What we last emitted. Incoming values are only pushed into the editor when
 * they differ from this — without the guard every keystroke round-trips through
 * the parent and calls setContent, which rebuilds the document and drops the
 * caret to the end of it on every character typed.
 */
let lastEmitted: string | undefined;

/*
 * Bumped on every ProseMirror transaction, and the toolbar's active state hangs
 * off it.
 *
 * ProseMirror owns its document and selection and mutates them itself; Vue has
 * no way to observe that. So `editor.isActive('bold')` is a perfectly correct
 * question with an answer that never changes on screen — the template has no
 * reactive dependency that a click inside bold text would invalidate, so it
 * simply never re-renders. This is the dependency.
 */
const revision = ref(0);

const headingLevels = computed(() => (features.value.headings === false ? [] : features.value.headings));

const editor = useEditor({
  content: renderMarkdownToHtml(model.value),
  editable: isEditable.value,
  extensions: [
    StarterKit.configure({
      // Every `false` here removes the node or mark from the schema.
      bold: features.value.bold ? undefined : false,
      italic: features.value.italic ? undefined : false,
      strike: features.value.strike ? undefined : false,
      code: features.value.code ? undefined : false,
      codeBlock: features.value.codeBlock ? undefined : false,
      blockquote: features.value.blockquote ? undefined : false,
      bulletList: features.value.bulletList ? undefined : false,
      orderedList: features.value.orderedList ? undefined : false,
      listItem: features.value.bulletList || features.value.orderedList ? undefined : false,
      horizontalRule: features.value.horizontalRule ? undefined : false,
      heading: headingLevels.value.length > 0 ? { levels: headingLevels.value } : false,
      /*
       * Underline has no markdown representation, so leaving it in the schema
       * would let an operator apply formatting that silently vanishes on save.
       * StarterKit includes it; markdown does not have it; out it goes.
       */
      underline: false,
      // Configured separately below, so this instance owns the URI policy.
      link: false,
      // Undo/redo, and the source of Ctrl+Z / Ctrl+Shift+Z.
      undoRedo: features.value.history ? undefined : false,
      // Keep StarterKit's TrailingNode; we also call ensureTrailingParagraph
      // on create/setContent because appendTransaction alone is too late.
      trailingNode: { node: 'paragraph', notAfter: ['paragraph'] },
    }),

    ...(features.value.link
      ? [
          Link.configure({
            openOnClick: false,
            autolink: true,
            defaultProtocol: 'https',
            protocols: ['http', 'https', 'mailto'],
            /*
             * The single place a URL is author-controlled. Anything outside the
             * three protocols above is refused here rather than left for the
             * renderer to catch — `javascript:`, `data:` and `vbscript:` never
             * become a mark in the first place, so they cannot reach the
             * serialized markdown either.
             */
            isAllowedUri: (uri, ctx) => isAllowedLinkUri(uri, ctx.defaultProtocol),
            HTMLAttributes: { rel: 'noopener noreferrer nofollow', target: '_blank' },
          }),
        ]
      : []),

    Placeholder.configure({ placeholder: () => props.placeholder ?? '' }),
    ...(props.maxLength !== undefined || props.showCount ? [CharacterCount.configure({ limit: props.maxLength })] : []),
  ],
  editorProps: {
    attributes: {
      class: 'r-md-editor__surface',
      ...(props.label ? { 'aria-label': props.label } : {}),
      ...(props.description ? { 'aria-describedby': describedBy } : {}),
    },
    /*
     * Ctrl+K opens the link dialog, matching the button's tooltip.
     *
     * stopPropagation as well as preventDefault, because an app may well have a
     * document-level Ctrl+K of its own — config-admin focuses the list filter
     * with it. Without the stop, one keystroke would open this dialog AND move
     * focus out of it.
     */
    handleKeyDown: (_view, event) => {
      if ((event.ctrlKey || event.metaKey) && !event.shiftKey && !event.altKey && event.key === 'k') {
        if (!features.value.link) return false;
        event.preventDefault();
        event.stopPropagation();
        openLinkDialog();
        return true;
      }

      /*
       * Tab reaches the open inline menu instead of leaving the field.
       *
       * The menu is the only way to format without a mouse once the fixed bar
       * is gone, and it renders on <body> — so document order puts it nowhere
       * near the editor and the natural Tab target is the next control on the
       * form. Redirecting it is what makes `menu="inline"` usable from the
       * keyboard at all.
       *
       * Only when a menu is actually open, and only forwards: Shift+Tab still
       * means "back out of this field", which is what the operator expects and
       * their only way past a field they do not want to format.
       */
      if (event.key === 'Tab' && !event.shiftKey && !event.altKey && !event.ctrlKey && !event.metaKey) {
        const menu = bubbleShown.value ? bubbleMenuEl.value : floatingShown.value ? floatingMenuEl.value : undefined;
        if (menu?.focusFirst()) {
          event.preventDefault();
          return true;
        }
        return false;
      }

      // Escape closes the menu. Handled only when one is open, so Escape still
      // reaches whatever is behind the field — a blade, a dialog — otherwise.
      if (event.key === 'Escape' && (bubbleShown.value || floatingShown.value)) {
        event.preventDefault();
        event.stopPropagation();
        dismissMenus();
        return true;
      }

      // Ctrl+Space asks for the menu back. Only when one is NOT showing, so the
      // shortcut cannot toggle a visible menu off by accident.
      if (
        event.key === ' ' &&
        event.ctrlKey &&
        !event.shiftKey &&
        !event.altKey &&
        !bubbleShown.value &&
        !floatingShown.value
      ) {
        event.preventDefault();
        event.stopPropagation();
        revealMenus();
        return true;
      }

      return false;
    },
    ...(props.pastePlainText
      ? {
          handlePaste: (view, event) => {
            const text = event.clipboardData?.getData('text/plain');
            if (text === undefined) return false;
            event.preventDefault();
            view.dispatch(view.state.tr.insertText(text));
            return true;
          },
        }
      : {}),
  },
  /*
   * Every transaction, not just onUpdate: a plain click moves the selection
   * without changing the document, and that is exactly the case the toolbar has
   * to react to. onSelectionUpdate would cover the click but not a formatting
   * change; onTransaction covers both.
   */
  onTransaction: () => {
    revision.value += 1;
  },
  onCreate: ({ editor: instance }) => {
    ensureTrailingParagraph(instance);
  },
  onUpdate: ({ editor: instance }) => {
    const markdown = serializeToMarkdown(instance.getJSON() as ProseMirrorNode);
    lastEmitted = markdown;
    model.value = markdown;
  },
});

watch(model, (next) => {
  if (!editor.value) return;
  if ((next ?? '') === (lastEmitted ?? '')) return;
  lastEmitted = next ?? '';
  // `emitUpdate: false` — this came FROM the parent, so echoing it back as an
  // update would be a loop with an extra render in it.
  editor.value.commands.setContent(renderMarkdownToHtml(next), { emitUpdate: false });
  ensureTrailingParagraph(editor.value);
});

watch(isEditable, (value) => editor.value?.setEditable(value));

onBeforeUnmount(() => editor.value?.destroy());

/* ── Toolbar ─────────────────────────────────────────────────────────────── */

const availableTools = computed<MarkdownToolSpec[]>(() =>
  buildTools(() => editor.value ?? undefined, features.value, openLinkDialog),
);

const tools = computed<MarkdownToolSpec[]>(() => tidySeparators(selectTools(availableTools.value, props.toolbar)));

/*
 * The inline menus show DIFFERENT subsets, because the two moments are
 * different questions.
 *
 * Over a selection the operator is asking "make this look like that", so the
 * bubble carries the marks and the link. On an empty line they are asking "what
 * kind of thing goes here", so the floating menu carries the block types. Undo
 * and redo appear in neither: they belong to the document, not to whatever the
 * caret happens to be sitting in, and a bubble that offers Undo invites undoing
 * something you cannot see.
 */
const INLINE_BLOCK_TOOLS = new Set<string>([
  'heading1',
  'heading2',
  'heading3',
  'heading4',
  'heading5',
  'heading6',
  'bulletList',
  'orderedList',
  'blockquote',
  'codeBlock',
  'horizontalRule',
]);

const HISTORY_TOOLS = new Set<string>(['undo', 'redo']);

const bubbleTools = computed(() =>
  tidySeparators(tools.value.filter((tool) => tool.kind === 'separator' || !HISTORY_TOOLS.has(tool.id))),
);

const floatingTools = computed(() => tools.value.filter((tool) => INLINE_BLOCK_TOOLS.has(tool.id)));

const rootEl = ref<HTMLElement>();

/*
 * The menus are appended to THIS COMPONENT'S root, not to <body>, and they
 * position with the `absolute` strategy rather than `fixed`. The two decisions
 * are one decision, and both were arrived at by getting them wrong.
 *
 * WHY NOT <body>. Theme tokens are inherited. An app that themes a subtree — a
 * light panel inside a dark shell — would get a menu painted in the ROOT theme
 * while the editor it belongs to is painted in the local one. And a modal
 * <dialog> is in the TOP LAYER, so a menu on <body> renders behind the scrim:
 * visible, dimmed, and unclickable.
 *
 * WHY NOT `fixed`. It looks like the safer choice — viewport coordinates,
 * immune to ancestor scrolling — and outside a dialog it is. Inside one it is
 * not: a top-layer element establishes a containing block for its fixed
 * descendants, so floating-ui's viewport maths resolves against the dialog and
 * the menu lands at the top-left corner of the screen. That is precisely what
 * MetadataEditor's description field is, which is why ui-showcase now has a
 * dialog specimen: config-admin cannot be opened without Azure AD, so the bug
 * would otherwise have shipped and been reported from production.
 *
 * `absolute` resolves against the nearest positioned ancestor instead — which
 * is the field wrapper below, made `position: relative` for exactly this — so
 * it is correct in both contexts. `flip` and `shift` keep it on screen when a
 * selection on the first line would otherwise push it out the top.
 */
const appendToRoot = () => rootEl.value ?? document.body;

const menuOptions = {
  strategy: 'absolute',
  flip: true,
  shift: { padding: 8 },
} as const;

/* ── Inline menu visibility ──────────────────────────────────────────────── */

/*
 * Showing and hiding go through the plugins' own meta channel, not through
 * `shouldShow` and not through a class of ours.
 *
 * `shouldShow` decides whether a menu is APPROPRIATE — focused editor plus a
 * non-empty selection / empty block — and both plugins ask it when the
 * document or selection actually changed (and FloatingMenu also once on
 * construct):
 *
 *     if (!selectionChanged && !docChanged) return
 *
 * Escape changes neither, so a predicate that consults a "dismissed" ref is
 * never re-run and the menu stays put. Dispatching an empty transaction to
 * nudge it fails for the same reason. Both plugins publish `hide` and `show`
 * metas for exactly this, and going through them means one source of truth
 * instead of a Vue ref racing a plugin that cannot see it.
 *
 * Explicit plugin keys, scoped to this field: two editors on one page would
 * otherwise share the default key, and a meta addressed to one would move the
 * other's menu.
 */
const bubbleKey = `${fieldId}-bubble`;
const floatingKey = `${fieldId}-floating`;

const bubbleShown = ref(false);
const floatingShown = ref(false);

const bubbleMenuEl = ref<{ focusFirst: () => boolean }>();
const floatingMenuEl = ref<{ focusFirst: () => boolean }>();

/*
 * When each menu appears BY ITSELF.
 *
 * Deliberately narrower than what Ctrl+Space will show — see revealMenus. These
 * two decide what an operator gets without asking, and the floating menu
 * appearing over every line they happen to put the caret in would be noise
 * rather than help.
 *
 * Both also require editor focus. TipTap's defaults do; replacing shouldShow
 * without that check meant an empty description field showed the floating menu
 * the moment a blade mounted — FloatingMenuView calls getShouldShow() once on
 * construct, before anyone has clicked in.
 */
const bubbleApplies = (state: EditorState) => !state.selection.empty;

const floatingApplies = (state: EditorState) => {
  const { selection } = state;
  const parent = selection.$anchor.parent;
  return selection.empty && isBlockEditable(state) && parent.content.size === 0;
};

/**
 * Whether the block tools mean anything where the caret is.
 *
 * A code block is the exclusion: its content is text to be shown verbatim, so
 * offering to make it a heading or a list is offering something that cannot
 * happen. Everything else is a paragraph or already a block type, and turning
 * one into another is exactly what the menu is for.
 */
function isBlockEditable(state: EditorState): boolean {
  const parent = state.selection.$anchor.parent;
  return parent.isTextblock && parent.type.name !== 'codeBlock';
}

/**
 * Focus for menu purposes: the surface itself, or a button inside the menu.
 *
 * Clicking Bold blurs the editor and focuses the button; without treating the
 * menu as still "in" the editor, shouldShow would hide mid-click and the mark
 * would never apply.
 */
function menuHasEditorFocus(view: EditorView, element: HTMLElement): boolean {
  return view.hasFocus() || element.contains(document.activeElement);
}

function shouldShowBubble({
  state,
  view,
  element,
}: {
  state: EditorState;
  view: EditorView;
  element: HTMLElement;
}): boolean {
  bubbleShown.value = menuHasEditorFocus(view, element) && bubbleApplies(state);
  return bubbleShown.value;
}

function shouldShowFloating({ state, view }: { state: EditorState; view: EditorView }): boolean {
  /*
   * FloatingMenu's shouldShow props omit `element`; TipTap hides on blur via its
   * own blurHandler, so hasFocus alone matches the upstream default.
   */
  floatingShown.value = view.hasFocus() && floatingApplies(state);
  return floatingShown.value;
}

function dismissMenus() {
  const instance = editor.value;
  if (!instance) return;
  instance.view.dispatch(instance.state.tr.setMeta(bubbleKey, 'hide').setMeta(floatingKey, 'hide'));
  bubbleShown.value = false;
  floatingShown.value = false;
}

/** Escape from INSIDE a menu: close it and put the caret back. */
function dismissMenusAndRefocus() {
  dismissMenus();
  editor.value?.commands.focus();
}

/**
 * Ctrl+Space — bring the menu back without moving the caret.
 *
 * The counterpart to Escape, and the only way back to a menu that was
 * dismissed: the plugins re-evaluate on selection or document change, so
 * short of typing something or clicking elsewhere there is otherwise nothing
 * an operator can do to ask for it again.
 *
 * It shows MORE than the menus offer on their own, and that asymmetry is the
 * point. A caret sitting in the middle of a written line gets no menu
 * unprompted — the block tools appearing over every line an operator passes
 * through would be noise — but asking for them there is a perfectly ordinary
 * thing to want: "make this paragraph a heading", with the caret already in it
 * and nothing selected. So the floating menu answers for any editable block,
 * not just an empty one. Unasked it stays out of the way; asked it turns up.
 *
 * The split by selection is not arbitrary either. A selection means the
 * question is about that text, so it gets the marks; no selection means the
 * question is about the block, so it gets the block types. Sending `show` to
 * both would put a bubble menu over an empty selection, anchored to a caret,
 * offering Bold with nothing to embolden — the `show` meta is UNCONDITIONAL,
 * the plugin positions and reveals without consulting shouldShow, so choosing
 * is ours to do.
 */
function revealMenus() {
  const instance = editor.value;
  if (!instance) return;

  const { state } = instance;
  const key = bubbleApplies(state) ? bubbleKey : isBlockEditable(state) ? floatingKey : undefined;
  if (!key) return;

  instance.view.dispatch(state.tr.setMeta(key, 'show'));
  if (key === bubbleKey) bubbleShown.value = true;
  else floatingShown.value = true;
}

const showToolbar = computed(() => props.menu === 'toolbar' && tools.value.length > 0 && isEditable.value);
const showInlineMenus = computed(() => props.menu === 'inline' && tools.value.length > 0 && isEditable.value);

/*
 * id → state, recomputed whenever the editor transacts.
 *
 * Maps rather than calling `tool.active()` in the template: the call would run
 * during render but track nothing, so the value would be right on first paint
 * and frozen thereafter. Both are built from `availableTools` rather than from
 * the visible subset, so the three surfaces share one computation.
 */
function stateMap(read: (tool: MarkdownToolSpec) => boolean): Record<string, boolean> {
  // Read the revision so this depends on it. Do not remove.
  void revision.value;
  const out: Record<string, boolean> = {};
  for (const tool of availableTools.value) out[tool.id] = read(tool);
  return out;
}

const activeTools = computed(() => stateMap((tool) => tool.active()));
const disabledTools = computed(() => stateMap((tool) => tool.disabled()));

/* ── Links ───────────────────────────────────────────────────────────────── */

const linkDialogOpen = ref(false);
const linkHref = ref('');

function openLinkDialog() {
  const current = editor.value?.getAttributes('link').href;
  linkHref.value = typeof current === 'string' ? current : '';
  linkDialogOpen.value = true;
}

/*
 * `extendMarkRange` first, so editing a link the caret merely sits inside
 * rewrites the whole link rather than splitting it in two at the caret.
 */
function applyLink(href: string) {
  editor.value?.chain().focus().extendMarkRange('link').setLink({ href }).run();
}

function removeLink() {
  editor.value?.chain().focus().extendMarkRange('link').unsetLink().run();
}

const characters = computed(() => editor.value?.storage.characterCount?.characters?.() ?? 0);
const words = computed(() => editor.value?.storage.characterCount?.words?.() ?? 0);
const overLimit = computed(() => props.maxLength !== undefined && characters.value > props.maxLength);
</script>

<template>
  <div
    ref="rootEl"
    class="r-field r-md-editor"
    :class="{
      'r-field--editable': editable,
      'r-field--disabled': disabled,
    }"
  >
    <label v-if="label" class="r-field__label" :for="fieldId">{{ label }}</label>

    <div class="r-md-editor__frame">
      <MarkdownToolbar
        v-if="showToolbar"
        :tools="tools"
        :active="activeTools"
        :disabled="disabledTools"
        :aria-label="`${label ?? 'Text'} formatting`"
      />

      <!--
        Both inline menus append to <body> and position `fixed`.

        The frame clips its children (`overflow: hidden`, so the toolbar's
        border corners stay inside the rounded box), and a menu positioned
        inside it would be cut off exactly when it matters — a selection on the
        first line puts the bubble above the frame's top edge. Appending to the
        body takes it out of that clipping context; `fixed` then keeps
        floating-ui's maths right relative to the viewport.
      -->
      <template v-if="editor && showInlineMenus">
        <BubbleMenu
          :editor="editor"
          :plugin-key="bubbleKey"
          class="r-md-editor__floating"
          :append-to="appendToRoot"
          :should-show="shouldShowBubble"
          :options="{ ...menuOptions, placement: 'top' }"
        >
          <MarkdownToolbar
            ref="bubbleMenuEl"
            :tools="bubbleTools"
            :active="activeTools"
            :disabled="disabledTools"
            variant="floating"
            aria-label="Format selection"
            @dismiss="dismissMenusAndRefocus"
          />
        </BubbleMenu>

        <FloatingMenu
          v-if="floatingTools.length > 0"
          :editor="editor"
          :plugin-key="floatingKey"
          class="r-md-editor__floating"
          :append-to="appendToRoot"
          :should-show="shouldShowFloating"
          :options="{ ...menuOptions, placement: 'bottom-start' }"
        >
          <MarkdownToolbar
            ref="floatingMenuEl"
            :tools="floatingTools"
            :active="activeTools"
            :disabled="disabledTools"
            variant="floating"
            aria-label="Insert block"
            @dismiss="dismissMenusAndRefocus"
          />
        </FloatingMenu>
      </template>

      <!--
        The editable surface. `editor` is null for the first tick while Tiptap
        builds, which is why EditorContent is guarded rather than the whole
        frame — the toolbar and border should not flash in afterwards.
      -->
      <EditorContent v-if="editor" :id="fieldId" class="r-md-editor__content" :editor="editor" />

      <div v-if="showCount || maxLength !== undefined" class="r-md-editor__count" :class="{ 'is-over': overLimit }">
        <component :is="chrome.Icon" v-if="overLimit && chrome.Icon" name="circle-alert" :size="12" />
        <span v-else-if="overLimit" class="r-md-editor__over-mark" aria-hidden="true">!</span>
        {{ characters }}<template v-if="maxLength !== undefined"> / {{ maxLength }}</template>
        <span class="r-md-editor__words">· {{ words }} words</span>
      </div>
    </div>

    <p v-if="description" :id="describedBy" class="r-field__hint">{{ description }}</p>

    <MarkdownLinkDialog
      v-model:open="linkDialogOpen"
      :initial-href="linkHref"
      @apply="applyLink"
      @remove="removeLink"
    />
  </div>
</template>

<style>
/*
 * Structural layout only. Brand tokens / typography / colours for the surface,
 * frame, and prose live in `@ets/ui/styles/editor.css` (or a host skin).
 *
 * `position: relative` is what the menus' `absolute` strategy resolves against.
 * Without it they would resolve against whatever ancestor happens to be
 * positioned — which is nothing on one page and a dialog on another. Not
 * decorative; see the appendToRoot note in the script.
 */
.r-md-editor {
  position: relative;
}

.r-md-editor__frame {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.r-md-editor__floating {
  z-index: 60;
}

.r-md-editor__content {
  /*
   * Height budget and scrollport live HERE, not on the contenteditable.
   * Putting min/max-height on `.r-md-editor__surface` as a flex child of an
   * `overflow: auto` flex container made Chrome reflow when the caret
   * appeared. Keep this a block formatting context.
   */
  display: block;
  min-height: v-bind('minHeightCss');
  max-height: v-bind('maxHeightCss');
  overflow: auto;
  overflow-anchor: none;
  /* Always reserve the gutter. When the field is nearly full, focus/caret can
     push scrollHeight over the edge; a scrollbar appearing then narrows the
     measure, rewraps a line, and the whole control jumps taller. */
  scrollbar-gutter: stable;
}

.r-md-editor__surface {
  /*
   * Same min-height token as the scrollport — not `inherit`. Inherit from an
   * `overflow: auto` parent whose used height is content-sized has been a
   * second source of focus-time measure changes in Chromium.
   */
  min-height: v-bind('minHeightCss');
  box-sizing: border-box;
}

.r-md-editor__surface:focus,
.r-md-editor__surface:focus-visible,
.r-md-editor__surface.ProseMirror-focused {
  /* Ring is the frame border (`:focus-within` in editor.css). */
  outline: none !important;
  outline-offset: 0 !important;
}

/* Tiptap's Placeholder marks the first empty node; without this it renders
   nothing at all and the field looks like it has lost its hint. */
.r-md-editor__surface p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  height: 0;
  opacity: 0.5;
  pointer-events: none;
}

.r-md-editor__surface > *:first-child {
  margin-top: 0;
}

.r-md-editor__surface > *:last-child {
  margin-bottom: 0;
}

/*
 * Empty paragraphs are `<p><br class="ProseMirror-trailingBreak"></p>` in the
 * view. Give them a stable line box so a trailing blank cannot collapse when
 * blurred and then reappear on focus.
 */
.r-md-editor__surface p:has(> br.ProseMirror-trailingBreak:only-child),
.r-md-editor__surface p:empty {
  min-height: 1lh;
}

.r-md-editor__count {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
}

.r-md-editor__over-mark {
  font-weight: 700;
}
</style>
