<script setup lang="ts">
/*
 * SimpleMarkdownEditor, on its OWN ROUTE rather than beside the Monaco editors.
 *
 * That is not filing — it is the proof. A separate lazily-loaded route is a
 * separate Rollup chunk, so "the markdown editor does not drag Monaco in" stops
 * being a claim about import graphs and becomes something you can grep for in
 * dist/. Put it on the Editors page and it would share that page's chunk with
 * Monaco, and the question would be unanswerable from the build output.
 *
 * Subpath import, no barrel: @ets/editor's barrel is Monaco-only, and this
 * module reaches Tiptap and the markdown pair and nothing else.
 */
import SimpleMarkdownEditor from '@ets/editor/components/SimpleMarkdownEditor';
import { Button, Dialog, Message } from '@ets/ui';
import { ref } from 'vue';
import Specimen from '../../components/Specimen.vue';

import PropsTable from '../../components/PropsTable.vue';
import CodeExample from '../../components/CodeExample.vue';
import { simpleMarkdownEditorExample } from '../../apiExamples';
import { simpleMarkdownEditorProps } from '../../apiDocs';

const richDescription = ref(
  [
    '## Pricing API',
    '',
    'Serves **indicative prices** to the trading desk.',
    '',
    '- Refreshes every 30 seconds',
    '- Owned by the `trading` group',
    '',
    '> Escalate to #pricing-support out of hours.',
  ].join('\n'),
);

const minimalNote = ref('Just **bold**, *italic* and a [link](https://example.invalid).');

const inlineNote = ref('Select this sentence to see the bubble menu.\n\n');

/*
 * The dialog case is here because it is config-admin's case: MetadataEditor's
 * description field is an inline-menu editor inside a modal <dialog>, and that
 * is the context most likely to break a floating element. `.r-dialog` clips its
 * children, the body scrolls, and showModal() puts the whole thing in the top
 * layer — three different ways a menu can end up cut off, behind, or misplaced.
 * config-admin cannot be opened without Azure AD, so this is where the shape
 * gets checked.
 */
const dialogOpen = ref(false);
const dialogNote = ref('A description, written in a dialog.\n\nSelect this line.');
const linked = ref('Escalate through the [on-call roster](https://example.invalid/roster) first.');
const countedSummary = ref('A short summary, capped so it stays short.');

/*
 * Deliberately hostile input, to show what survives the round trip.
 *
 * The closing tag is assembled rather than written out. A literal one in here
 * ends the <script setup> block, and the SFC then parses with no template
 * attached — which surfaces as "declared but never read" on every import in the
 * file rather than as anything resembling the actual problem.
 */
const CLOSE_SCRIPT = '</' + 'script>';

const hostile = ref(
  [
    `Tag-shaped text stays text: <script>alert(1)${CLOSE_SCRIPT} and <img src=x onerror="alert(1)">.`,
    '',
    String.raw`Escaped markup stays literal too: \*not bold\* and \_not italic\_.`,
  ].join('\n'),
);
</script>

<template>
  <Message severity="info">
    <strong>The value is markdown; the editing is not.</strong> Tiptap over ProseMirror, so an operator formats with a
    toolbar and the usual shortcuts and never sees syntax. Reach for <strong>Editors → MarkdownEditor</strong> instead
    when someone wants to see exactly what is stored; reach for this when they just want a sentence in bold.
  </Message>

  <Message severity="warning">
    <strong>No HTML crosses this boundary in either direction.</strong> Markdown comes IN through the sanitised renderer
    this package already shipped — <code>markdown-it</code> with <code>html: false</code>, then a DOMPurify allow-list —
    so the HTML Tiptap parses is our own output, not author input. It is HELD as a ProseMirror document whose schema is
    a second and stricter allow-list: anything pasted from a web page that the schema does not model is dropped at parse
    time rather than filtered afterwards. It goes OUT through a hand-written serializer that emits markdown punctuation
    and never a tag. Links are limited to http/https/mailto, so <code>javascript:</code> never becomes a mark. Images,
    raw HTML and tables are left out on purpose.
  </Message>

  <Specimen
    title="Default"
    note="Undo/redo, bold, italic, inline code, H2/H3, both list kinds, quote and link, grouped by separators. Markdown input rules work as you type — “## ” makes a heading, “- ” starts a list — and Ctrl+B / Ctrl+I / Ctrl+Z do what you expect. Undo and redo disable themselves at the ends of the history rather than sitting there doing nothing. The block underneath is the value that would be saved."
  >
    <div class="rt__stack">
      <SimpleMarkdownEditor v-model="richDescription" label="Description" />
      <p class="rt__label">Markdown value:</p>
      <pre class="rt__out">{{ richDescription }}</pre>
    </div>
  </Specimen>

  <Specimen
    title="Inline menus"
    note='menu="inline" drops the fixed strip. Select some text and a bubble menu appears over it with the marks and the link; put the caret on an empty line and a floating menu offers the block types instead. Undo and redo are in neither — they belong to the document rather than to whatever the caret is sitting in, and a bubble that offers Undo invites undoing something you cannot see. Keyboard: Tab moves into an open menu (arrows within it), Escape closes it, and Ctrl+Space asks for it back without moving the caret — otherwise a dismissed menu could only be recovered by typing or clicking elsewhere. Ctrl+Space deliberately shows MORE than turns up on its own: with nothing selected it offers the block types wherever the caret is, not only on an empty line, so “make this paragraph a heading” does not require selecting it first. The menus are loaded on demand, so a field using the fixed toolbar never downloads the positioning engine.'
  >
    <div class="rt__stack">
      <SimpleMarkdownEditor
        v-model="inlineNote"
        label="Release note"
        menu="inline"
        placeholder="Type, or select something…"
      />
      <p class="rt__label">Markdown value:</p>
      <pre class="rt__out">{{ inlineNote }}</pre>
    </div>
  </Specimen>

  <Specimen
    title="Inline menus in a dialog"
    note="config-admin's actual shape — MetadataEditor's description field is this, inside a modal dialog. Worth its own specimen because a dialog is three hazards at once for a floating element: .r-dialog clips its children, its body scrolls, and showModal() puts it in the top layer. Select a line and check the menu is not cut off at the dialog's edge."
  >
    <div>
      <Button variant="outlined" @click="dialogOpen = true">Edit description…</Button>
      <Dialog
        v-model:open="dialogOpen"
        title="Metadata"
        description="The same arrangement config-admin uses."
        size="md"
      >
        <SimpleMarkdownEditor v-model="dialogNote" label="Description" menu="inline" min-height="8rem" />
        <template #footer>
          <Button variant="text" @click="dialogOpen = false">Cancel</Button>
          <Button variant="outlined" @click="dialogOpen = false">Save</Button>
        </template>
      </Dialog>
    </div>
  </Specimen>

  <Specimen
    title="Links"
    note="Ctrl+K, or the chain button. The dialog is the application's own — window.prompt is suppressed outright in sandboxed frames and by some enterprise policies, so a link editor built on it can simply fail to appear. Put the caret inside an existing link and it opens as Edit, with a Remove link button; a javascript: URL is refused with a message rather than silently declined."
  >
    <div class="rt__stack">
      <SimpleMarkdownEditor
        v-model="linked"
        label="With links"
        :toolbar="['bold', 'italic', 'divider', 'link']"
        min-height="5rem"
      />
      <p class="rt__label">Markdown value:</p>
      <pre class="rt__out">{{ linked }}</pre>
    </div>
  </Specimen>

  <Specimen
    title="Trimmed down"
    note="features removes a node from the SCHEMA, not just a button from the toolbar — so a heading turned off here cannot arrive by shortcut, by input rule, or by pasting one either. This instance keeps inline marks and a link and nothing structural."
  >
    <div class="rt__stack">
      <SimpleMarkdownEditor
        v-model="minimalNote"
        label="Short note"
        placeholder="A sentence or two…"
        :features="{ headings: false, bulletList: false, orderedList: false, blockquote: false, code: false }"
        min-height="5rem"
      />
      <p class="rt__label">Markdown value:</p>
      <pre class="rt__out">{{ minimalNote }}</pre>
    </div>
  </Specimen>

  <Specimen
    title="Counted, and paste-as-plain-text"
    note="maxLength counts the TEXT rather than the markup, so formatting never eats an operator's budget. pastePlainText drops formatting on paste — not a safety switch, since the schema already handles that, but useful where inheriting a web page's heading structure is simply unwanted."
  >
    <SimpleMarkdownEditor
      v-model="countedSummary"
      label="Summary"
      description="Shown on the services list."
      :max-length="120"
      paste-plain-text
      :toolbar="['bold', 'italic', 'link']"
      min-height="4rem"
    />
  </Specimen>

  <Specimen
    title="Hostile input"
    note="Paste a script tag, or type one. It stays text on the way in, in the document, and on the way out — the serializer has no branch that emits a tag. The escaped asterisks show the other half: type a literal * in the editor and it comes back escaped, so it does not become emphasis on the next load."
  >
    <div class="rt__stack">
      <SimpleMarkdownEditor v-model="hostile" label="Try to break it" min-height="6rem" />
      <p class="rt__label">Markdown value:</p>
      <pre class="rt__out">{{ hostile }}</pre>
    </div>
  </Specimen>

  <Specimen
    title="Read-only and disabled"
    note="The toolbar is hidden rather than disabled — a row of dead buttons reads as broken."
  >
    <div class="rt__stack">
      <SimpleMarkdownEditor :model-value="minimalNote" label="Read-only" readonly min-height="3rem" />
      <SimpleMarkdownEditor :model-value="minimalNote" label="Disabled" disabled min-height="3rem" />
    </div>
  </Specimen>
  <CodeExample :code="simpleMarkdownEditorExample" />

  <PropsTable :rows="simpleMarkdownEditorProps" />
</template>

<style scoped>
.rt__stack {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}

.rt__label {
  margin: var(--sp-2) 0 0;
  color: var(--fg-muted);
  font-size: var(--fs-sm);
}

.rt__out {
  padding: var(--sp-3);
  border: 1px solid var(--border-default);
  border-radius: var(--r-md);
  background: var(--bg-surface);
  font-family: var(--font-mono, var(--font-data));
  font-size: var(--fs-xs);
  white-space: pre-wrap;
  overflow-x: auto;
}
</style>
