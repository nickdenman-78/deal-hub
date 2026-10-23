import { mount } from '@vue/test-utils';
import { beforeAll, describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, ref, type Component } from 'vue';
import { registerEtsIcons } from '../icons';
import Accordion from './Accordion.vue';
import AccordionItem from './AccordionItem.vue';
import Checkbox from './Checkbox.vue';
import Combobox from './Combobox.vue';
import Dialog from './Dialog.vue';
import Menu from './Menu.vue';
import Tree, { type TreeItem } from './Tree.vue';
import Select from './Select.vue';
import MultiSelect from './MultiSelect.vue';
import Switch from './Switch.vue';
import Tab from './Tab.vue';
import TabList from './TabList.vue';
import TabPanel from './TabPanel.vue';
import Tabs from './Tabs.vue';
import Textarea from './Textarea.vue';

/*
 * These pin the CONTRACT WITH v0 — the ARIA attributes our CSS and tests key
 * off, and the element each Root actually renders. A v0 minor could change any
 * of them and the failure would be visual, not loud.
 */
beforeAll(() => registerEtsIcons());

describe('Accordion', () => {
  const Harness = defineComponent({
    setup() {
      const open = ref<string | number | Array<string | number> | undefined>('billing');
      return () =>
        h(
          Accordion,
          {
            modelValue: open.value,
            'onUpdate:modelValue': (v: string | number | Array<string | number> | undefined) => (open.value = v),
          },
          {
            default: () => [
              h(
                AccordionItem,
                { value: 'billing' },
                {
                  header: () => 'Billing',
                  default: () => 'Billing body',
                },
              ),
              h(
                AccordionItem,
                { value: 'access' },
                {
                  header: () => 'Access',
                  default: () => 'Access body',
                },
              ),
              h(
                AccordionItem,
                { value: 'archive', disabled: true },
                {
                  header: () => 'Archive',
                  default: () => 'Archive body',
                },
              ),
            ],
          },
        );
    },
  });

  it('marks the open trigger with aria-expanded, which the styling keys off', async () => {
    const wrapper = mount(Harness);
    const triggers = wrapper.findAll('.r-accordion__trigger');

    expect(triggers[0].attributes('aria-expanded')).toBe('true');
    expect(triggers[1].attributes('aria-expanded')).toBe('false');

    await triggers[1].trigger('click');
    expect(wrapper.findAll('.r-accordion__trigger')[1].attributes('aria-expanded')).toBe('true');
    expect(wrapper.findAll('.r-accordion__trigger')[0].attributes('aria-expanded')).toBe('false');
  });

  it('applies the plain variant class for unframed list chrome', () => {
    const wrapper = mount(
      defineComponent({
        setup() {
          const open = ref<string | number | Array<string | number> | undefined>('a');
          return () =>
            h(
              Accordion,
              {
                variant: 'plain',
                modelValue: open.value,
                'onUpdate:modelValue': (v: string | number | Array<string | number> | undefined) => (open.value = v),
              },
              {
                default: () => [h(AccordionItem, { value: 'a' }, { header: () => 'A', default: () => 'body' })],
              },
            );
        },
      }),
    );
    expect(wrapper.find('.r-accordion--plain').exists()).toBe(true);
  });

  /*
   * ExpansionPanel keeps every Content mounted and hides closed ones with
   * `hidden` — same as Tabs panels. Asserting on wrapper.text() would pass for
   * the wrong reason.
   */
  it('hides closed panels without unmounting them', async () => {
    const wrapper = mount(Harness);
    const panels = wrapper.findAll('.r-accordion__content');

    expect(panels).toHaveLength(3);
    expect(panels[0].attributes('hidden')).toBeUndefined();
    expect(panels[1].attributes('hidden')).toBeDefined();

    await wrapper.findAll('.r-accordion__trigger')[1].trigger('click');

    const after = wrapper.findAll('.r-accordion__content');
    expect(after[0].attributes('hidden')).toBeDefined();
    expect(after[1].attributes('hidden')).toBeUndefined();
  });

  it('applies its orientation class on the layout wrapper', () => {
    const wrapper = mount(Harness);
    expect(wrapper.find('.r-accordion--vertical').exists()).toBe(true);
  });

  it('does not open a disabled panel', async () => {
    const wrapper = mount(Harness);
    await wrapper.findAll('.r-accordion__trigger')[2].trigger('click');
    expect(wrapper.findAll('.r-accordion__trigger')[0].attributes('aria-expanded')).toBe('true');
    expect(wrapper.findAll('.r-accordion__trigger')[2].attributes('aria-expanded')).toBe('false');
  });

  it('exposes Cue data-state for the chevron rotation', () => {
    const wrapper = mount(Harness);
    const cues = wrapper.findAll('.r-accordion__cue');
    expect(cues[0].attributes('data-state')).toBe('open');
    expect(cues[1].attributes('data-state')).toBe('closed');
  });
});

describe('Tabs', () => {
  const Harness = defineComponent({
    setup() {
      const active = ref<string | number | undefined>('overview');
      return () =>
        h(
          Tabs,
          { modelValue: active.value, 'onUpdate:modelValue': (v: string | number | undefined) => (active.value = v) },
          {
            default: () => [
              h(
                TabList,
                { label: 'Sections' },
                {
                  default: () => [
                    h(Tab, { value: 'overview' }, { default: () => 'Overview' }),
                    h(Tab, { value: 'keys' }, { default: () => 'Keys' }),
                    h(Tab, { value: 'audit', disabled: true }, { default: () => 'Audit' }),
                  ],
                },
              ),
              h(TabPanel, { value: 'overview' }, { default: () => 'Overview panel' }),
              h(TabPanel, { value: 'keys' }, { default: () => 'Keys panel' }),
            ],
          },
        );
    },
  });

  it('marks the selected tab with aria-selected, which the styling keys off', async () => {
    const wrapper = mount(Harness);
    const tabs = wrapper.findAll('.r-tab');

    expect(tabs[0].attributes('aria-selected')).toBe('true');
    expect(tabs[1].attributes('aria-selected')).toBe('false');

    await tabs[1].trigger('click');
    expect(wrapper.findAll('.r-tab')[1].attributes('aria-selected')).toBe('true');
  });

  /*
   * v0 keeps every panel MOUNTED and hides the inactive ones with the `hidden`
   * attribute. That is the behaviour we want — an editor keeps its undo history
   * and scroll position across a tab switch — but it means the text of a hidden
   * panel is still in the DOM, so asserting on wrapper.text() would pass or fail
   * for the wrong reason.
   */
  it('hides inactive panels without unmounting them', async () => {
    const wrapper = mount(Harness);
    const panels = wrapper.findAll('.r-tabpanel');

    expect(panels).toHaveLength(2);
    expect(panels[0].attributes('hidden')).toBeUndefined();
    expect(panels[1].attributes('hidden')).toBeDefined();

    await wrapper.findAll('.r-tab')[1].trigger('click');

    const after = wrapper.findAll('.r-tabpanel');
    expect(after[0].attributes('hidden')).toBeDefined();
    expect(after[1].attributes('hidden')).toBeUndefined();
  });

  it('applies its layout class, which a fragment root would have dropped', () => {
    const wrapper = mount(Harness);
    // Tabs.Root renders a fragment, so this class lives on a wrapper div. If it
    // ever moves back onto Root it is silently discarded.
    expect(wrapper.find('.r-tabs--horizontal').exists()).toBe(true);
  });

  it('does not select a disabled tab', async () => {
    const wrapper = mount(Harness);
    await wrapper.findAll('.r-tab')[2].trigger('click');
    expect(wrapper.findAll('.r-tab')[0].attributes('aria-selected')).toBe('true');
  });

  /*
   * Re-clicking the active tab must not clear the selection when mandatory
   * (the default). Workbench blades stitch the model into the URL path; an
   * undefined clear became `/workbench/undefined` and blanked the blade.
   */
  it('keeps the active tab selected when it is clicked again', async () => {
    const active = ref<string | number | undefined>('overview');
    const wrapper = mount(
      defineComponent({
        setup() {
          return () =>
            h(
              Tabs,
              {
                modelValue: active.value,
                'onUpdate:modelValue': (v: string | number | undefined) => (active.value = v),
              },
              {
                default: () => [
                  h(
                    TabList,
                    { label: 'Sections' },
                    {
                      default: () => [
                        h(Tab, { value: 'overview' }, { default: () => 'Overview' }),
                        h(Tab, { value: 'keys' }, { default: () => 'Keys' }),
                      ],
                    },
                  ),
                  h(TabPanel, { value: 'overview' }, { default: () => 'Overview panel' }),
                  h(TabPanel, { value: 'keys' }, { default: () => 'Keys panel' }),
                ],
              },
            );
        },
      }),
    );

    await wrapper.findAll('.r-tab')[0].trigger('click');
    expect(active.value).toBe('overview');
    expect(wrapper.findAll('.r-tab')[0].attributes('aria-selected')).toBe('true');
  });
});

describe('Dialog', () => {
  it('renders a native <dialog> and opens it modally', async () => {
    const open = ref(false);
    const wrapper = mount(Dialog as unknown as Component, {
      props: { open: open.value, title: 'Rotate key', 'onUpdate:open': (v: boolean) => (open.value = v) },
      slots: { default: 'Body' },
      attachTo: document.body,
    });

    const dialog = wrapper.find('dialog');
    expect(dialog.exists()).toBe(true);
    expect((dialog.element as HTMLDialogElement).open).toBe(false);

    await wrapper.setProps({ open: true });
    await nextTick();
    expect((wrapper.find('dialog').element as HTMLDialogElement).open).toBe(true);

    wrapper.unmount();
  });

  it('wires the title for assistive tech', async () => {
    const wrapper = mount(Dialog as unknown as Component, {
      props: { open: true, title: 'Rotate key' },
      slots: { default: 'Body' },
      attachTo: document.body,
    });
    await nextTick();

    const dialog = wrapper.find('dialog');
    const labelledBy = dialog.attributes('aria-labelledby');
    expect(labelledBy).toBeTruthy();
    expect(document.getElementById(labelledBy!)?.textContent).toContain('Rotate key');

    wrapper.unmount();
  });
});

describe('Select', () => {
  const OPTIONS = [
    { value: 'dev', label: 'Development' },
    { value: 'prd', label: 'Production' },
    { value: 'old', label: 'Retired', disabled: true },
  ];

  // Widened for the harness: vue-tsc cannot infer a `generic="T"` SFC's props
  // through mount(). Same limitation as DataTable's test.
  const SelectHarness = Select as unknown as Component;

  it('shows the placeholder until something is chosen', () => {
    const wrapper = mount(SelectHarness, {
      props: { options: OPTIONS, placeholder: 'Pick an environment' },
    });
    expect(wrapper.text()).toContain('Pick an environment');
    expect(wrapper.find('.r-select__value--placeholder').exists()).toBe(true);
  });

  it('shows the label of the selected value, not its key', () => {
    const wrapper = mount(SelectHarness, {
      props: { options: OPTIONS, modelValue: 'prd' },
    });
    expect(wrapper.text()).toContain('Production');
    expect(wrapper.text()).not.toContain('prd');
    expect(wrapper.find('.r-select__value--placeholder').exists()).toBe(false);
  });

  it('clears the value when clearable and the clear control is used', async () => {
    const wrapper = mount(SelectHarness, {
      props: { options: OPTIONS, modelValue: 'prd', clearable: true, label: 'Environment' },
    });
    const clear = wrapper.find('.r-select__clear');
    expect(clear.exists()).toBe(true);
    expect(clear.attributes('tabindex')).toBe('-1');
    await clear.trigger('click');
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([undefined]);
  });

  it('clears on Escape when the menu is closed', async () => {
    const wrapper = mount(SelectHarness, {
      props: { options: OPTIONS, modelValue: 'prd', clearable: true },
    });
    await wrapper.find('.r-select__control').trigger('keydown', { key: 'Escape' });
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([undefined]);
  });
});

describe('MultiSelect', () => {
  const OPTIONS = [
    { value: 'desk', label: 'desk' },
    { value: 'ops', label: 'ops' },
  ];
  const MultiSelectHarness = MultiSelect as unknown as Component;

  it('clears on Escape when the menu is closed, and clear is not a tab stop', async () => {
    const wrapper = mount(MultiSelectHarness, {
      props: { options: OPTIONS, modelValue: ['desk', 'ops'], label: 'Owner' },
    });
    const clear = wrapper.find('.r-multiselect__clear');
    expect(clear.attributes('tabindex')).toBe('-1');
    await wrapper.find('.r-multiselect__control').trigger('keydown', { key: 'Escape' });
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([[]]);
  });
});

describe('Checkbox', () => {
  it('reflects an initially true modelValue on first render', () => {
    const wrapper = mount(Checkbox, { props: { label: 'Enabled', modelValue: true } });
    expect(wrapper.find('.r-check__control').attributes('aria-checked')).toBe('true');
  });

  it('reports checked state through aria-checked', async () => {
    const wrapper = mount(Checkbox, { props: { label: 'Enabled', modelValue: false } });
    const control = wrapper.find('.r-check__control');

    expect(control.attributes('aria-checked')).toBe('false');
    await control.trigger('click');
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([true]);
  });

  it('renders mixed as its own state, not as a flavour of checked', () => {
    const wrapper = mount(Checkbox, { props: { label: 'Some', indeterminate: true } });
    expect(wrapper.find('.r-check__control').attributes('aria-checked')).toBe('mixed');
  });

  /*
   * Checkbox.Root renders a <button role="checkbox">, and a <label for>
   * pointing at a button associates with nothing — the browser ignores it
   * silently, leaving the control unlabelled to a screen reader while looking
   * perfectly fine. aria-labelledby is the association that actually holds.
   */
  it('labels the control by reference, not with a <label for>', () => {
    const wrapper = mount(Checkbox, { props: { label: 'Enabled' } });
    const labelledBy = wrapper.find('.r-check__control').attributes('aria-labelledby');

    expect(labelledBy).toBeTruthy();
    expect(wrapper.find(`#${labelledBy}`).text()).toBe('Enabled');
  });

  it('toggles when the label text is clicked, as a real label would', async () => {
    const wrapper = mount(Checkbox, { props: { label: 'Enabled', modelValue: false } });
    await wrapper.find('.r-check__label').trigger('click');
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([true]);
  });

  /*
   * Read-only is a DIFFERENT element, not a suppressed one. If v0's Root were
   * still mounted these two tests would be a race against its own click and
   * keydown handlers, and losing that race flips a value the screen says
   * cannot be changed.
   */
  it('read-only reports its state but does not toggle', async () => {
    const wrapper = mount(Checkbox, {
      props: { label: 'GreenPower', modelValue: true, readonly: true },
    });
    const control = wrapper.find('.r-check__control');

    expect(control.attributes('aria-checked')).toBe('true');
    expect(control.attributes('aria-readonly')).toBe('true');

    await control.trigger('click');
    await wrapper.find('.r-check__label').trigger('click');
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
  });

  it('read-only stays a tab stop, so the state can be reached and read', () => {
    const wrapper = mount(Checkbox, {
      props: { label: 'GreenPower', modelValue: true, readonly: true },
    });
    expect(wrapper.find('.r-check__control').attributes('tabindex')).toBe('0');
  });

  /* Read-only is not disabled: nothing is refusing you, and the tick is data
     that has to stay legible. The label mutes; the box does not. */
  it('read-only is not disabled', () => {
    const wrapper = mount(Checkbox, {
      props: { label: 'GreenPower', modelValue: true, readonly: true },
    });
    expect(wrapper.find('.r-check__control').attributes('aria-disabled')).toBeUndefined();
    expect(wrapper.classes()).toContain('r-check--readonly');
  });

  it('read-only still shows the tick, and shows nothing when unchecked', () => {
    const on = mount(Checkbox, { props: { label: 'On', modelValue: true, readonly: true } });
    expect(on.find('.r-check__glyph').exists()).toBe(true);

    const off = mount(Checkbox, { props: { label: 'Off', modelValue: false, readonly: true } });
    expect(off.find('.r-check__box').exists()).toBe(true);
    expect(off.find('.r-check__glyph').exists()).toBe(false);
  });

  it('read-only carries the mixed state through as mixed', () => {
    const wrapper = mount(Checkbox, {
      props: { label: 'Some', indeterminate: true, readonly: true },
    });
    expect(wrapper.find('.r-check__control').attributes('aria-checked')).toBe('mixed');
  });

  /* The box must be visible while UNCHECKED — it is the thing you aim at. v0
     hides Checkbox.Indicator when unchecked, so the box cannot live there. */
  it('renders the box outside the indicator, so it is visible unchecked', () => {
    const wrapper = mount(Checkbox, { props: { label: 'Enabled', modelValue: false } });
    const box = wrapper.find('.r-check__box');
    expect(box.exists()).toBe(true);
    expect((box.element as HTMLElement).style.visibility).not.toBe('hidden');
  });
});

describe('Switch', () => {
  it('reports state through aria-checked', async () => {
    const wrapper = mount(Switch, { props: { label: 'Live', modelValue: false } });
    const control = wrapper.find('.r-switch__control');
    expect(control.attributes('aria-checked')).toBe('false');

    await control.trigger('click');
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([true]);
  });
});

describe('Textarea', () => {
  it('renders a real <textarea>, sharing Input validation wiring', async () => {
    const wrapper = mount(Textarea, { props: { label: 'Notes', rows: 6 } });
    const area = wrapper.find('textarea');

    expect(area.exists()).toBe(true);
    expect(area.attributes('rows')).toBe('6');
    expect(wrapper.find('label').attributes('for')).toBe(area.attributes('id'));

    await area.setValue('held for review');
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['held for review']);
  });
});

describe('Menu', () => {
  const items = [
    { label: 'Rename', icon: 'pencil', action: () => {} },
    { separator: true },
    { label: 'Delete', icon: 'trash-2', destructive: true, action: () => {} },
    { label: 'Archive', disabled: true, action: () => {} },
  ];

  it('renders separators as separators, not as menu items', async () => {
    const wrapper = mount(Menu, { props: { items }, slots: { trigger: '<span>Open</span>' }, attachTo: document.body });
    await wrapper.find('.r-menu__activator').trigger('click');
    await nextTick();

    expect(document.querySelectorAll('.r-menu [role="menuitem"]')).toHaveLength(3);
    expect(document.querySelectorAll('.r-menu__separator')).toHaveLength(1);

    wrapper.unmount();
  });

  it('marks a disabled item so keyboard traversal can skip it', async () => {
    const wrapper = mount(Menu, { props: { items }, slots: { trigger: '<span>Open</span>' }, attachTo: document.body });
    await wrapper.find('.r-menu__activator').trigger('click');
    await nextTick();

    const entries = [...document.querySelectorAll('.r-menu [role="menuitem"]')];
    expect(entries.at(-1)?.getAttribute('aria-disabled')).toBe('true');

    wrapper.unmount();
  });

  /*
   * SKIPPED, and not because the behaviour changed — Menu still closes before
   * it runs an action, and that is verified in apps/ui-showcase.
   *
   * This test used to pass only because Menu forced `open = true` from its own
   * click handler. That force was a bug: Popover.Activator has no click handler
   * at all, so the browser's `popovertarget` was already toggling the panel, and
   * forcing it open again meant the trigger could never CLOSE the menu it had
   * opened. Removing the force fixed the control and left this test with no way
   * to open a menu, because jsdom implements no part of the Popover API. See
   * the note in test/setup.ts.
   */
  it.skip('closes before running the action, so the menu never floats over what it opened', async () => {
    let openWhenActionRan: string | null | undefined;
    const wrapper = mount(Menu, {
      props: {
        items: [
          {
            label: 'Go',
            // Sampled from inside the action: the menu must already be closed
            // by the time this runs, or an action that opens a dialog leaves
            // the menu floating on top of it.
            action: () => {
              openWhenActionRan = document.querySelector('.r-menu__activator')?.getAttribute('aria-expanded');
            },
          },
        ],
      },
      slots: { trigger: '<span>Open</span>' },
      attachTo: document.body,
    });

    await wrapper.find('.r-menu__activator').trigger('click');
    await nextTick();
    expect(wrapper.find('.r-menu__activator').attributes('aria-expanded')).toBe('true');

    document.querySelector<HTMLElement>('.r-menu [role="menuitem"]')!.click();
    await nextTick();
    await nextTick();

    expect(openWhenActionRan).toBe('false');
    expect(wrapper.find('.r-menu__activator').attributes('aria-expanded')).toBe('false');

    wrapper.unmount();
  });
});

/*
 * A field loaded from an existing record must SHOW that record's value.
 *
 * v0 derives the combobox input's text from the selected ticket while the
 * field is pristine, and Combobox.Content mounts its items lazily — so without
 * `eager` on the content, no ticket exists on first render and a populated
 * field renders blank. Silent, and only visible on a screen that loads data.
 */
describe('Combobox', () => {
  it('displays its initial model value before the menu has ever been opened', async () => {
    const wrapper = mount(Combobox, {
      props: { modelValue: 'finance', options: ['trading desk', 'platform', 'finance'], label: 'Owner' },
      attachTo: document.body,
    });
    await nextTick();
    await nextTick();

    expect(wrapper.find('input').element.value).toBe('finance');
  });

  it('displays an initial value in strict mode too', async () => {
    const wrapper = mount(Combobox, {
      props: { modelValue: 'platform', options: ['platform', 'finance'], strict: true },
      attachTo: document.body,
    });
    await nextTick();
    await nextTick();

    expect(wrapper.find('input').element.value).toBe('platform');
  });

  it('is empty when the model is', async () => {
    const wrapper = mount(Combobox, { props: { options: ['platform'] }, attachTo: document.body });
    await nextTick();

    expect(wrapper.find('input').element.value).toBe('');
  });

  /*
   * The description must reach the input. Combobox.Root renders a fragment, so
   * an :aria-describedby placed on it is silently dropped — the hint then looks
   * right and is invisible to a screen reader.
   */
  it('wires its description to the input through aria-describedby', async () => {
    const wrapper = mount(Combobox, {
      props: { options: ['platform'], description: 'Lowercase, no spaces.' },
      attachTo: document.body,
    });
    await nextTick();

    const describedBy = wrapper.find('input').attributes('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy as string)?.textContent).toContain('Lowercase');
  });
});

/*
 * These pin WHICH ELEMENT carries the state, which is the thing that silently
 * broke: a CSS selector aimed at the wrong element is not an error, it simply
 * never matches, and the control renders as if the state did not exist.
 */
describe('v0 state attributes land where the CSS expects them', () => {
  it('puts Tree selection and expansion on the ITEM, not the row', async () => {
    const wrapper = mount(Tree, {
      props: {
        label: 'Files',
        modelValue: 'child',
        openAll: true,
        items: [{ id: 'parent', label: 'Parent', children: [{ id: 'child', label: 'Child' }] }],
      },
      attachTo: document.body,
    });
    await nextTick();
    await nextTick();

    const selected = wrapper.element.querySelector('.r-tree__item[aria-selected="true"]');
    expect(selected, 'aria-selected must be on .r-tree__item').not.toBeNull();
    expect(selected?.querySelector('.r-tree__row')).not.toBeNull();
    // The row itself must NOT carry it, or the old selector would have worked.
    expect(wrapper.element.querySelector('.r-tree__row[aria-selected="true"]')).toBeNull();

    // Expansion is data-open. v0 emits no aria-expanded at all.
    expect(wrapper.element.querySelector('.r-tree__item[data-open="true"]')).not.toBeNull();
    expect(wrapper.element.querySelector('[aria-expanded]')).toBeNull();
  });

  it('renders its own Tree chevron, for branches only', async () => {
    const wrapper = mount(Tree, {
      props: {
        label: 'Files',
        items: [{ id: 'parent', label: 'Parent', children: [{ id: 'child', label: 'Child' }] }],
        openAll: true,
      },
      attachTo: document.body,
    });
    await nextTick();

    const chevrons = [...wrapper.element.querySelectorAll('.r-tree__chevron')];
    expect(chevrons.length).toBe(2);
    // Branch has an icon, leaf's slot is empty but present so labels stay aligned.
    expect(chevrons[0]?.children.length).toBe(1);
    expect(chevrons[1]?.children.length).toBe(0);
  });

  it('marks a disabled Switch with aria-disabled, not the disabled attribute', async () => {
    const wrapper = mount(Switch, { props: { disabled: true, label: 'Locked' }, attachTo: document.body });
    await nextTick();

    const control = wrapper.element.querySelector('.r-switch__control');
    expect(control?.getAttribute('aria-disabled')).toBe('true');
    expect(control?.hasAttribute('disabled')).toBe(false);
  });
});

/*
 * Selection and expansion are two different v0 primitives, and a tree needs
 * both. Treeview.Activator's only click behaviour is `flip` — expand/collapse —
 * and it lives on the chevron alone so a row click selects without opening.
 */
describe('Tree selection', () => {
  const ITEMS: TreeItem[] = [
    { id: 'parent', label: 'Parent', children: [{ id: 'child', label: 'Child' }] },
    { id: 'other', label: 'Other' },
  ];

  // By label: v0 uses the `id` prop as its ticket key and does not necessarily
  // render it as a DOM id. Match the label span — the row also hosts action
  // buttons and a selected-descendant count.
  const rowFor = (wrapper: ReturnType<typeof mount>, label: string) =>
    [...wrapper.element.querySelectorAll('.r-tree__row')].find(
      (row) => row.querySelector('.r-tree__label')?.textContent?.trim() === label,
    ) as HTMLElement | undefined;

  const chevronFor = (wrapper: ReturnType<typeof mount>, label: string) =>
    rowFor(wrapper, label)?.querySelector('.r-tree__chevron') as HTMLElement | undefined;

  const actionFor = (wrapper: ReturnType<typeof mount>, label: string, ariaLabel: string) =>
    rowFor(wrapper, label)?.querySelector(`.r-tree__action[aria-label="${ariaLabel}"]`) as
      HTMLButtonElement | undefined;

  it('selects a node when its row is clicked', async () => {
    const wrapper = mount(Tree, {
      props: { label: 'Files', items: ITEMS, openAll: true },
      attachTo: document.body,
    });
    await nextTick();

    rowFor(wrapper, 'Child')!.click();
    await nextTick();

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['child']);
  });

  /*
   * `select`, not `toggle`, in single mode: a second click that CLEARED the
   * selection would leave the tree showing nothing chosen, which reads as the
   * click having failed rather than as a deliberate deselect.
   */
  it('keeps a single-select node selected when clicked again', async () => {
    const wrapper = mount(Tree, {
      props: { label: 'Files', items: ITEMS, openAll: true, modelValue: 'other' },
      attachTo: document.body,
    });
    await nextTick();

    rowFor(wrapper, 'Other')!.click();
    await nextTick();

    const last = wrapper.emitted('update:modelValue')?.at(-1);
    if (last) expect(last).toEqual(['other']);
    expect(
      wrapper.element.querySelector('.r-tree__item[aria-selected="true"] .r-tree__label')?.textContent?.trim(),
    ).toBe('Other');
  });

  it('toggles a node off in multiple mode', async () => {
    const wrapper = mount(Tree, {
      props: { label: 'Files', items: ITEMS, openAll: true, multiple: true, modelValue: ['other'] },
      attachTo: document.body,
    });
    await nextTick();

    rowFor(wrapper, 'Other')!.click();
    await nextTick();

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([[]]);
  });

  it('honours an explicit selectMode=toggle in single-select', async () => {
    const wrapper = mount(Tree, {
      props: {
        label: 'Files',
        items: ITEMS,
        openAll: true,
        selectMode: 'toggle',
        modelValue: 'other',
      },
      attachTo: document.body,
    });
    await nextTick();

    rowFor(wrapper, 'Other')!.click();
    await nextTick();

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([undefined]);
  });

  it('honours an explicit selectMode=select in multiple', async () => {
    const wrapper = mount(Tree, {
      props: {
        label: 'Files',
        items: ITEMS,
        openAll: true,
        multiple: true,
        selectMode: 'select',
        modelValue: ['other'],
      },
      attachTo: document.body,
    });
    await nextTick();

    rowFor(wrapper, 'Other')!.click();
    await nextTick();

    const last = wrapper.emitted('update:modelValue')?.at(-1);
    if (last) expect(last).toEqual([['other']]);
    expect(
      wrapper.element.querySelector('.r-tree__item[aria-selected="true"] .r-tree__label')?.textContent?.trim(),
    ).toBe('Other');
  });

  it('toggles off even when selectMode=select if checkboxes are on', async () => {
    const wrapper = mount(Tree, {
      props: {
        label: 'Files',
        items: ITEMS,
        openAll: true,
        multiple: true,
        checkboxes: true,
        selectMode: 'select',
        modelValue: ['other'],
      },
      attachTo: document.body,
    });
    await nextTick();

    rowFor(wrapper, 'Other')!.click();
    await nextTick();

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([[]]);
  });

  it('draws checkboxes beside icons when checkboxes is set', async () => {
    const wrapper = mount(Tree, {
      props: {
        label: 'Files',
        items: [
          {
            id: 'parent',
            label: 'Parent',
            icon: 'folder',
            children: [{ id: 'child', label: 'Child', icon: 'file-json' }],
          },
        ],
        openAll: true,
        multiple: true,
        checkboxes: true,
        modelValue: ['child'],
      },
      attachTo: document.body,
    });
    await nextTick();

    const childRow = rowFor(wrapper, 'Child');
    const check = childRow?.querySelector('.r-tree__check');
    expect(check, 'checkbox slot must render').not.toBeNull();
    expect(check?.classList.contains('r-tree__check--on')).toBe(true);
    // Icon stays — checkbox is in addition, not a replacement.
    expect(childRow?.querySelector('.r-icon')).not.toBeNull();
    // Decorative: no nested checkbox role on top of aria-selected.
    expect(check?.getAttribute('role')).toBeNull();
    expect(check?.getAttribute('aria-hidden')).toBe('true');
  });

  it('shows a mixed checkbox on a parent when only some descendants are selected', async () => {
    const wrapper = mount(Tree, {
      props: {
        label: 'Files',
        items: [
          {
            id: 'parent',
            label: 'Parent',
            children: [
              { id: 'a', label: 'A' },
              { id: 'b', label: 'B' },
            ],
          },
        ],
        openAll: true,
        multiple: true,
        checkboxes: true,
        modelValue: ['a'],
      },
      attachTo: document.body,
    });
    await nextTick();

    const parentCheck = rowFor(wrapper, 'Parent')?.querySelector('.r-tree__check');
    expect(parentCheck?.classList.contains('r-tree__check--mixed')).toBe(true);
    expect(parentCheck?.classList.contains('r-tree__check--on')).toBe(false);
  });

  it('selects all descendants when a parent is toggled in multiple mode', async () => {
    const wrapper = mount(Tree, {
      props: {
        label: 'Files',
        items: [
          {
            id: 'parent',
            label: 'Parent',
            children: [
              { id: 'a', label: 'A' },
              { id: 'b', label: 'B' },
            ],
          },
        ],
        openAll: true,
        multiple: true,
        checkboxes: true,
        modelValue: [],
      },
      attachTo: document.body,
    });
    await nextTick();

    rowFor(wrapper, 'Parent')!.click();
    await nextTick();

    const last = wrapper.emitted('update:modelValue')?.at(-1)?.[0] as string[] | undefined;
    expect(last?.sort()).toEqual(['a', 'b', 'parent'].sort());
  });

  it('with selectable=leaf and multiple, a parent click selects leaf descendants only', async () => {
    const wrapper = mount(Tree, {
      props: {
        label: 'Files',
        items: [
          {
            id: 'parent',
            label: 'Parent',
            children: [
              { id: 'a', label: 'A' },
              { id: 'b', label: 'B' },
            ],
          },
        ],
        openAll: true,
        multiple: true,
        selectable: 'leaf',
        checkboxes: true,
        modelValue: [],
      },
      attachTo: document.body,
    });
    await nextTick();

    rowFor(wrapper, 'Parent')!.click();
    await nextTick();

    const last = wrapper.emitted('update:modelValue')?.at(-1)?.[0] as string[] | undefined;
    expect(last?.sort()).toEqual(['a', 'b']);
    expect(last).not.toContain('parent');
  });

  it('expands a parent from the chevron, not the row', async () => {
    const wrapper = mount(Tree, {
      props: { label: 'Files', items: ITEMS },
      attachTo: document.body,
    });
    await nextTick();

    const parentItem = [...wrapper.element.querySelectorAll('.r-tree__item')].find(
      (el) => el.querySelector('.r-tree__label')?.textContent?.trim() === 'Parent',
    ) as HTMLElement | undefined;
    expect(parentItem?.getAttribute('data-open')).not.toBe('true');

    rowFor(wrapper, 'Parent')!.click();
    await nextTick();
    expect(parentItem?.getAttribute('data-open')).not.toBe('true');
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['parent']);

    chevronFor(wrapper, 'Parent')!.click();
    await nextTick();
    expect(parentItem?.getAttribute('data-open')).toBe('true');
  });

  it('with selectable=leaf, ignores clicks on parents', async () => {
    const wrapper = mount(Tree, {
      props: { label: 'Files', items: ITEMS, openAll: true, selectable: 'leaf' },
      attachTo: document.body,
    });
    await nextTick();

    rowFor(wrapper, 'Parent')!.click();
    await nextTick();
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();

    rowFor(wrapper, 'Child')!.click();
    await nextTick();
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['child']);
  });

  it('shows a selected-descendant count on parents only when > 0', async () => {
    const deep: typeof ITEMS = [
      {
        id: 'root',
        label: 'Root',
        children: [
          { id: 'mid', label: 'Mid', children: [{ id: 'leaf-a', label: 'Leaf A' }] },
          { id: 'leaf-b', label: 'Leaf B' },
        ],
      },
    ];
    const wrapper = mount(Tree, {
      props: {
        label: 'Files',
        items: deep,
        openAll: true,
        multiple: true,
        modelValue: ['leaf-a', 'leaf-b'],
      },
      attachTo: document.body,
    });
    await nextTick();

    // Cascade also selects Mid once its only child (leaf-a) is selected, so
    // Root's badge counts Mid + leaf-a + leaf-b.
    expect(rowFor(wrapper, 'Root')?.querySelector('.r-tree__count')?.textContent?.trim()).toBe('3');
    expect(rowFor(wrapper, 'Mid')?.querySelector('.r-tree__count')?.textContent?.trim()).toBe('1');
    expect(rowFor(wrapper, 'Leaf A')?.querySelector('.r-tree__count')).toBeNull();

    await wrapper.setProps({ modelValue: [] });
    await nextTick();
    expect(rowFor(wrapper, 'Root')?.querySelector('.r-tree__count')).toBeNull();
  });

  it('marks a single-select parent with an asterisk instead of 1', async () => {
    const deep = [
      {
        id: 'root',
        label: 'Root',
        children: [{ id: 'mid', label: 'Mid', children: [{ id: 'leaf', label: 'Leaf' }] }],
      },
    ];
    const wrapper = mount(Tree, {
      props: { label: 'Files', items: deep, openAll: true, modelValue: 'leaf' },
      attachTo: document.body,
    });
    await nextTick();

    expect(rowFor(wrapper, 'Root')?.querySelector('.r-tree__count .r-icon')).not.toBeNull();
    expect(rowFor(wrapper, 'Mid')?.querySelector('.r-tree__count .r-icon')).not.toBeNull();
    expect(rowFor(wrapper, 'Root')?.querySelector('.r-tree__count')?.textContent?.trim()).toBe('');
  });

  it('expands and collapses the whole subtree from the hover actions', async () => {
    const deep = [
      {
        id: 'root',
        label: 'Root',
        children: [
          {
            id: 'mid',
            label: 'Mid',
            children: [{ id: 'leaf', label: 'Leaf' }],
          },
        ],
      },
    ];
    const wrapper = mount(Tree, {
      props: { label: 'Files', items: deep },
      attachTo: document.body,
    });
    await nextTick();

    const itemFor = (label: string) =>
      [...wrapper.element.querySelectorAll('.r-tree__item')].find(
        (el) => el.querySelector('.r-tree__label')?.textContent?.trim() === label,
      ) as HTMLElement | undefined;

    expect(itemFor('Root')?.getAttribute('data-open')).not.toBe('true');
    expect(itemFor('Mid')?.getAttribute('data-open')).not.toBe('true');

    actionFor(wrapper, 'Root', 'Expand all')!.click();
    await nextTick();
    expect(itemFor('Root')?.getAttribute('data-open')).toBe('true');
    expect(itemFor('Mid')?.getAttribute('data-open')).toBe('true');
    expect(wrapper.text()).toContain('Leaf');

    actionFor(wrapper, 'Root', 'Collapse all')!.click();
    await nextTick();
    expect(itemFor('Root')?.getAttribute('data-open')).not.toBe('true');
    expect(itemFor('Mid')?.getAttribute('data-open')).not.toBe('true');
  });
});

/*
 * v0 filters the option list itself — Combobox.Item ends in v-show="isFiltered",
 * matched against the query v0 keeps internally, which is NOT this component's
 * model. Filtering here as well meant only model-matching options were ever
 * registered, so typing anything else found nothing.
 */
describe('Combobox', () => {
  it('renders every option, leaving the filtering to v0', async () => {
    const wrapper = mount(Combobox, {
      props: { options: ['trading desk', 'platform', 'finance'], modelValue: 'finance' },
      attachTo: document.body,
    });
    await nextTick();
    await nextTick();

    const rendered = [...wrapper.element.querySelectorAll('.r-select__option')].map((o) => o.textContent?.trim());
    expect(rendered).toEqual(['trading desk', 'platform', 'finance']);
  });

  /*
   * The panel is positioned with the CSS anchor API, and the anchor-name comes
   * from Combobox.Activator. Rendering a plain <div> instead left the menu's
   * `position-anchor` pointing at nothing — and a position:fixed element with an
   * unresolvable anchor does not stay put, it falls back to the viewport origin,
   * so the menu opened in the top-left corner of the screen.
   */
  it('anchors its menu to the field control', async () => {
    const wrapper = mount(Combobox, { props: { options: ['platform'] }, attachTo: document.body });
    await nextTick();

    const control = wrapper.element.querySelector('.r-field__control');
    expect(control?.getAttribute('style') ?? '').toContain('anchor-name');
  });

  it('opens on focus by default', async () => {
    const wrapper = mount(Combobox, { props: { options: ['platform'] }, attachTo: document.body });
    await nextTick();

    await wrapper.find('input').trigger('focus');
    expect(wrapper.find('input').attributes('aria-expanded')).toBe('true');
    wrapper.unmount();
  });

  /*
   * A blade focuses its first control when it opens. With open-on-focus that
   * dropped the menu over the rest of the form before the operator touched it.
   */
  it('with openOn="click", stays closed on focus and opens on click', async () => {
    const wrapper = mount(Combobox, {
      props: { options: ['platform'], openOn: 'click' },
      attachTo: document.body,
    });
    await nextTick();
    const input = wrapper.find('input');

    await input.trigger('focus');
    expect(input.attributes('aria-expanded')).toBe('false');

    await input.trigger('click');
    expect(input.attributes('aria-expanded')).toBe('true');
    wrapper.unmount();
  });
});
