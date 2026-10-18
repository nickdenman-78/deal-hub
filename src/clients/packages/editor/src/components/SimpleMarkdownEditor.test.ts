import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import SimpleMarkdownEditor from './SimpleMarkdownEditor.vue';

/*
 * Only the toolbar's pressed state is tested here, and only through attributes.
 *
 * ProseMirror runs in jsdom well enough to build a document and answer
 * isActive(), but it has no layout, so anything about carets, coordinates or
 * what the operator sees is verified in apps/ui-showcase instead — the same
 * call this package already makes for Monaco.
 *
 * The INLINE MENUS are in that second category and doubly so: they arrive
 * through a dynamic import and position with floating-ui, so in jsdom they
 * neither load nor have anywhere to be. Escape, Ctrl+Space, Tab-into-menu and
 * the arrow keys are exercised in ui-showcase, which has a specimen for the
 * modal-dialog case specifically because that is config-admin's arrangement and
 * config-admin cannot be opened without Azure AD.
 */
const settle = async () => {
  await nextTick();
  await new Promise((resolve) => setTimeout(resolve, 0));
  await nextTick();
};

const tools = (wrapper: ReturnType<typeof mount>) => [...wrapper.element.querySelectorAll('.r-md-toolbar__tool')];

const toolNamed = (wrapper: ReturnType<typeof mount>, prefix: string) =>
  tools(wrapper).find((b) => b.getAttribute('aria-label')?.startsWith(prefix)) as HTMLElement | undefined;

describe('SimpleMarkdownEditor toolbar', () => {
  /*
   * `aria-pressed` must be RENDERED while false, not merely absent.
   *
   * Two bugs met here. Vue drops an attribute bound to boolean `false`, so
   * `:aria-pressed="someBoolean"` only ever appears once true — the styling hook
   * and the assistive-tech announcement both vanish in the off state. And v0's
   * ButtonRoot sets `aria-pressed: group ? isSelected : undefined` and merges
   * its own attrs AFTER fallthrough, so @ets/ui's Button silently overwrote
   * an author value with undefined. Hence plain <button> elements and a string
   * binding.
   */
  it('renders aria-pressed on every toggle, false included', async () => {
    const wrapper = mount(SimpleMarkdownEditor, { props: { modelValue: 'plain text' }, attachTo: document.body });
    await settle();

    const toggles = tools(wrapper).filter((b) => !/^(Undo|Redo)/.test(b.getAttribute('aria-label') ?? ''));
    expect(toggles.length).toBeGreaterThan(0);
    for (const button of toggles) {
      expect(button.getAttribute('aria-pressed'), button.getAttribute('aria-label') ?? '').toBe('false');
    }

    wrapper.unmount();
  });

  /*
   * Undo is never "on". A permanent aria-pressed="false" would announce a
   * toggle that cannot be toggled, so history buttons carry `disabled` instead
   * — which is the state that actually changes, and which starts out true
   * because a freshly-loaded document has nothing behind it.
   */
  it('gives undo and redo a disabled state rather than a pressed one', async () => {
    const wrapper = mount(SimpleMarkdownEditor, { props: { modelValue: 'plain text' }, attachTo: document.body });
    await settle();

    const undo = toolNamed(wrapper, 'Undo');
    const redo = toolNamed(wrapper, 'Redo');
    expect(undo).toBeDefined();
    expect(undo?.hasAttribute('aria-pressed')).toBe(false);
    expect((undo as HTMLButtonElement).disabled).toBe(true);
    expect((redo as HTMLButtonElement).disabled).toBe(true);

    // A document change — a list wraps the paragraph, so there is a real step
    // to undo. Toggling a MARK would not do: with an empty selection that only
    // sets stored marks, which the history does not record.
    toolNamed(wrapper, 'Bulleted list')?.click();
    await settle();
    expect((undo as HTMLButtonElement).disabled).toBe(false);
    expect((redo as HTMLButtonElement).disabled).toBe(true);

    undo?.click();
    await settle();
    expect((undo as HTMLButtonElement).disabled).toBe(true);
    expect((redo as HTMLButtonElement).disabled).toBe(false);

    wrapper.unmount();
  });

  it('omits the history buttons when the feature is off', async () => {
    const wrapper = mount(SimpleMarkdownEditor, {
      props: { modelValue: 'x', features: { history: false } },
      attachTo: document.body,
    });
    await settle();

    expect(toolNamed(wrapper, 'Undo')).toBeUndefined();
    expect(toolNamed(wrapper, 'Bold')).toBeDefined();
    wrapper.unmount();
  });

  /*
   * window.prompt is not merely ugly — it is suppressed outright in sandboxed
   * frames and by some enterprise policies, so a link editor built on it can
   * simply not appear. Nothing in this component may call it.
   */
  it('does not reach for window.prompt', async () => {
    const wrapper = mount(SimpleMarkdownEditor, { props: { modelValue: 'x' }, attachTo: document.body });
    await settle();

    const prompt = vi.spyOn(window, 'prompt');
    toolNamed(wrapper, 'Link')?.click();
    await settle();

    expect(prompt).not.toHaveBeenCalled();
    prompt.mockRestore();
    wrapper.unmount();
  });

  it('does not build its tools from @ets/ui Button, which cannot carry aria-pressed', async () => {
    const wrapper = mount(SimpleMarkdownEditor, { props: { modelValue: 'x' }, attachTo: document.body });
    await settle();

    expect(wrapper.element.querySelector('.r-md-toolbar .r-btn')).toBeNull();
    wrapper.unmount();
  });

  /*
   * The reactivity half. ProseMirror mutates its own state, so without a
   * dependency the template never re-renders and the pressed state is correct
   * exactly once — on first paint — and frozen after.
   */
  it('flips the pressed state when the mark under the cursor changes', async () => {
    const wrapper = mount(SimpleMarkdownEditor, { props: { modelValue: 'plain text' }, attachTo: document.body });
    await settle();

    const bold = toolNamed(wrapper, 'Bold');
    expect(bold?.getAttribute('aria-pressed')).toBe('false');

    bold?.click();
    await settle();
    expect(bold?.getAttribute('aria-pressed')).toBe('true');

    bold?.click();
    await settle();
    expect(bold?.getAttribute('aria-pressed')).toBe('false');

    wrapper.unmount();
  });

  it('offers only the tools its features allow', async () => {
    const wrapper = mount(SimpleMarkdownEditor, {
      props: {
        modelValue: '',
        features: { headings: false, bulletList: false, orderedList: false, blockquote: false, code: false },
      },
      attachTo: document.body,
    });
    await settle();

    const labels = tools(wrapper).map((b) => b.getAttribute('aria-label'));
    expect(labels.some((l) => l?.startsWith('Bold'))).toBe(true);
    expect(labels.some((l) => l?.startsWith('Heading'))).toBe(false);
    expect(labels.some((l) => l?.startsWith('Bulleted'))).toBe(false);
    expect(labels.some((l) => l?.startsWith('Quote'))).toBe(false);

    wrapper.unmount();
  });

  it('hides the toolbar entirely when read-only', async () => {
    const wrapper = mount(SimpleMarkdownEditor, {
      props: { modelValue: 'x', readonly: true },
      attachTo: document.body,
    });
    await settle();

    // Hidden rather than disabled: a row of dead buttons reads as broken.
    expect(wrapper.element.querySelector('.r-md-toolbar')).toBeNull();
    wrapper.unmount();
  });
});
