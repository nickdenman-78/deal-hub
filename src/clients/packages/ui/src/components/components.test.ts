import { mount } from '@vue/test-utils';
import { beforeAll, describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { registerEtsIcons } from '../icons';
import Button from './Button.vue';
import Badge from './Badge.vue';
import Card from './Card.vue';
import Icon from './Icon.vue';
import Input from './Input.vue';
import Message from './Message.vue';
import Spinner from './Spinner.vue';
import GradientDivider from './GradientDivider.vue';
import Tag from './Tag.vue';
import Select from './Select.vue';
import MultiSelect from './MultiSelect.vue';
import TagsInput from '../composite/TagsInput.vue';
import KeyValueEditor from '../composite/KeyValueEditor.vue';

/*
 * These exist to pin the CONTRACT WITH v0, not to re-test v0 itself. Every
 * assertion below is something a v0 minor could silently change — the element
 * a Root renders as, whether Control emits input, how ARIA is wired — and
 * which would fail visually rather than loudly if we did not check it here.
 * createDataTable is preview-level; the components used here are stable, but
 * the same reasoning applies.
 */
beforeAll(() => {
  registerEtsIcons();
});

describe('Icon', () => {
  it('hides decorative icons from assistive tech', () => {
    const wrapper = mount(Icon, { props: { name: 'check' } });
    expect(wrapper.attributes('aria-hidden')).toBe('true');
    expect(wrapper.attributes('role')).toBeUndefined();
  });

  it('exposes a labelled icon as an image', () => {
    const wrapper = mount(Icon, { props: { name: 'check', label: 'Verified' } });
    // Iconify drops aria-hidden entirely when passed an explicit false, rather
    // than rendering "false". Passing `undefined` instead would leave its own
    // default aria-hidden="true" in place and hide a labelled icon.
    expect(wrapper.attributes('aria-hidden')).toBeUndefined();
    expect(wrapper.attributes('role')).toBe('img');
    expect(wrapper.attributes('aria-label')).toBe('Verified');
  });

  /*
   * The test that actually proves the offline pipeline: names.json →
   * build-icons.mjs → generated/lucide.json → addCollection → rendered path
   * data, with no network involved.
   *
   * Note the two ticks. Iconify paints an empty 16x16 placeholder synchronously
   * and swaps in the real icon on the next tick, so a synchronous assertion
   * here cannot tell a resolved icon from a missing one — both are an empty
   * <svg>. That is also why a typo in an icon name is invisible at runtime, and
   * why build-icons.mjs fails the build on an unknown name instead.
   */
  it('renders real path data from the offline subset', async () => {
    const wrapper = mount(Icon, { props: { name: 'check' } });
    await nextTick();
    await nextTick();

    const svg = wrapper.find('svg');
    expect(svg.attributes('viewBox')).toBe('0 0 24 24');
    expect(svg.element.innerHTML).toContain('<path');
    expect(svg.classes()).toContain('iconify--lucide');
  });

  it('renders nothing recognisable for a name outside the subset', async () => {
    const wrapper = mount(Icon, { props: { name: 'not-a-real-icon' } });
    await nextTick();
    await nextTick();

    expect(wrapper.find('svg').element.innerHTML).toBe('');
  });
});

/*
 * NOTE: assert against `find('button')`, never `wrapper.element`.
 *
 * v0's Button.Root renders a FRAGMENT — the <button> plus a trailing
 * placeholder for its optional hidden form input — which makes this component
 * multi-root. test-utils then reports a synthetic wrapper element, so
 * `wrapper.classes()` is empty and `wrapper.element.tagName` is 'DIV'. Neither
 * reflects what actually renders in a browser.
 */
describe('Button', () => {
  /*
   * The icon and the label must share a FLEX parent, or they fall back to
   * inline layout and sit on the text baseline instead of a common centre —
   * which put the label about 2px below the icon on every button with both.
   *
   * v0 renders Button.Content as a bare <span> with no class and no data
   * attribute, so `.r-btn`'s own flex/gap/align-items governed Content as a
   * single child and never reached inside it. The styling hook has to be a
   * class we put there ourselves; this asserts it is still present, because
   * losing it is invisible to typecheck and to every other test.
   */
  it('gives the icon and label a shared flex parent to centre against', () => {
    const wrapper = mount(Button, { props: { icon: 'plus' }, slots: { default: 'Add' } });

    const content = wrapper.element.querySelector('.r-btn__content');
    expect(content, 'Button.Content must carry .r-btn__content').not.toBeNull();
    expect(content?.querySelector('.r-btn__icon')).not.toBeNull();
    expect(content?.querySelector('.r-btn__label')).not.toBeNull();
  });

  it('renders a real <button>, so forms and keyboards work', () => {
    const wrapper = mount(Button, { slots: { default: 'Save' } });
    expect(wrapper.find('button').exists()).toBe(true);
    expect(wrapper.text()).toContain('Save');
  });

  it('applies severity, variant and size classes', () => {
    const wrapper = mount(Button, { props: { severity: 'primary', size: 'lg' }, slots: { default: 'Go' } });
    expect(wrapper.find('button').classes()).toEqual(
      expect.arrayContaining(['r-btn', 'r-severity-primary', 'r-btn--basic', 'r-btn--lg', 'r-btn--weight-medium']),
    );
  });

  it('maps raisedText to a kebab class', () => {
    const wrapper = mount(Button, { props: { variant: 'raisedText' }, slots: { default: 'Go' } });
    expect(wrapper.find('button').classes()).toContain('r-btn--raised-text');
  });

  it('supports regular (non-bold) weight for quiet chrome', () => {
    const wrapper = mount(Button, {
      props: { variant: 'link', weight: 'regular' },
      slots: { default: 'New key' },
    });
    expect(wrapper.find('button').classes()).toContain('r-btn--weight-regular');
  });

  it('infers icon-only from an icon with no children', () => {
    const wrapper = mount(Button, { props: { icon: 'x', ariaLabel: 'Close' } });
    expect(wrapper.find('button').classes()).toContain('r-btn--icon-only');
    expect(wrapper.find('button').attributes('aria-label')).toBe('Close');
  });

  it('is not icon-only when it also has a label', () => {
    const wrapper = mount(Button, { props: { icon: 'plus' }, slots: { default: 'Add' } });
    expect(wrapper.find('button').classes()).not.toContain('r-btn--icon-only');
  });

  it('blocks activation while disabled', () => {
    const button = mount(Button, { props: { disabled: true }, slots: { default: 'Save' } }).find('button');
    expect(button.attributes('disabled')).toBeDefined();
    expect(button.attributes('aria-disabled')).toBe('true');
    // Removed from the tab order too — a disabled control you can still focus
    // is a keyboard trap that looks fine to a mouse user.
    expect(button.attributes('tabindex')).toBe('-1');
  });

  /*
   * Load-bearing for the config-admin migration: 32 call sites pass classes and
   * test ids to buttons. A fragment root would normally break fallthrough and
   * emit "Extraneous non-emits event listeners" warnings — v0 handles it, and
   * this test is what tells us if that ever stops being true.
   */
  it('merges consumer classes and attributes onto the button', () => {
    const wrapper = mount(Button, {
      attrs: { class: 'view-local', 'data-testid': 'save' },
      slots: { default: 'Save' },
    });
    const button = wrapper.find('button');
    expect(button.classes()).toEqual(expect.arrayContaining(['r-btn', 'view-local']));
    expect(button.attributes('data-testid')).toBe('save');
  });
});

describe('Tag', () => {
  it('defaults to a soft secondary chip', () => {
    const wrapper = mount(Tag, { slots: { default: 'Draft' } });
    expect(wrapper.classes()).toEqual(expect.arrayContaining(['r-tag', 'r-severity-secondary', 'r-tag--soft']));
  });

  it('carries severity and variant through', () => {
    const wrapper = mount(Tag, { props: { severity: 'success', variant: 'solid' }, slots: { default: 'Active' } });
    expect(wrapper.classes()).toEqual(expect.arrayContaining(['r-severity-success', 'r-tag--solid']));
  });
});

describe('Badge', () => {
  it('overlays a capped count on a host', () => {
    const wrapper = mount(Badge, {
      props: { content: 120, max: 99, severity: 'error' },
      slots: { default: '<button type="button">Mail</button>' },
    });
    expect(wrapper.classes()).toEqual(expect.arrayContaining(['r-badge', 'r-badge--top-end']));
    expect(wrapper.find('.r-badge__mark').classes()).toEqual(expect.arrayContaining(['r-severity-error']));
    expect(wrapper.find('.r-badge__label').text()).toBe('99+');
    expect(wrapper.find('.r-badge__host').exists()).toBe(true);
  });

  it('hides when the count is zero unless dot is set', () => {
    const plain = mount(Badge, { props: { content: 0 } });
    expect(plain.find('.r-badge__mark').exists()).toBe(false);

    const dot = mount(Badge, { props: { content: 0, dot: true } });
    expect(dot.find('.r-badge__mark--dot').exists()).toBe(true);
  });
});

describe('Message', () => {
  it('announces errors assertively', () => {
    const wrapper = mount(Message, { props: { severity: 'error' }, slots: { default: 'Save failed' } });
    expect(wrapper.attributes('role')).toBe('alert');
    expect(wrapper.attributes('aria-live')).toBe('assertive');
  });

  it('announces info politely', () => {
    const wrapper = mount(Message, { slots: { default: 'Saved' } });
    expect(wrapper.attributes('role')).toBe('status');
    expect(wrapper.attributes('aria-live')).toBe('polite');
  });

  it('emits close only when closable', async () => {
    const plain = mount(Message, { slots: { default: 'x' } });
    expect(plain.find('.r-message__close').exists()).toBe(false);

    const closable = mount(Message, { props: { closable: true }, slots: { default: 'x' } });
    await closable.find('.r-message__close').trigger('click');
    expect(closable.emitted('close')).toHaveLength(1);
  });
});

describe('Card', () => {
  it('omits the header entirely when there is nothing to put in it', () => {
    const wrapper = mount(Card, { slots: { default: 'body' } });
    expect(wrapper.find('.r-card__header').exists()).toBe(false);
    expect(wrapper.find('.r-card__footer').exists()).toBe(false);
  });

  it('renders title, subtitle and footer when given', () => {
    const wrapper = mount(Card, {
      props: { title: 'Services', subtitle: '12 registered' },
      slots: { default: 'body', footer: 'actions' },
    });
    expect(wrapper.find('.r-card__title').text()).toBe('Services');
    expect(wrapper.find('.r-card__subtitle').text()).toBe('12 registered');
    expect(wrapper.find('.r-card__footer').text()).toBe('actions');
  });
});

describe('Spinner', () => {
  it('announces itself, so a loading page is not silent', () => {
    const wrapper = mount(Spinner);
    expect(wrapper.attributes('role')).toBe('status');
    expect(wrapper.attributes('aria-label')).toBe('Loading');
  });
});

describe('GradientDivider', () => {
  it('exposes separator semantics and orientation', () => {
    const vertical = mount(GradientDivider);
    expect(vertical.attributes('role')).toBe('separator');
    expect(vertical.attributes('aria-orientation')).toBe('vertical');
    expect(vertical.classes()).toContain('r-gradient-divider--vertical');

    const horizontal = mount(GradientDivider, { props: { orientation: 'horizontal' } });
    expect(horizontal.attributes('aria-orientation')).toBe('horizontal');
    expect(horizontal.classes()).toContain('r-gradient-divider--horizontal');
  });

  it('sizes the thin and long axes from thickness and length', () => {
    const wrapper = mount(GradientDivider, { props: { thickness: 3, length: 120 } });
    const style = wrapper.attributes('style') ?? '';
    expect(style).toMatch(/width:\s*3px/);
    expect(style).toMatch(/height:\s*120px/);
  });

  it('fills the parent when length is auto', () => {
    const horizontal = mount(GradientDivider, {
      props: { orientation: 'horizontal', length: 'auto' },
    });
    expect(horizontal.attributes('style')).toMatch(/width:\s*100%/);

    const vertical = mount(GradientDivider, { props: { length: 'auto' } });
    expect(vertical.attributes('style')).toMatch(/height:\s*100%/);
  });
});

describe('Input', () => {
  it('renders a native input associated with its visible label', () => {
    const wrapper = mount(Input, { props: { label: 'Service name' } });
    const input = wrapper.find('input');
    const label = wrapper.find('label');

    expect(input.exists()).toBe(true);
    expect(label.text()).toContain('Service name');
    // The whole reason we generate the id ourselves rather than let v0 do it.
    expect(label.attributes('for')).toBe(input.attributes('id'));
    expect(label.attributes('for')).toBeTruthy();
  });

  it('round-trips v-model', async () => {
    const wrapper = mount(Input, { props: { label: 'Name', modelValue: '' } });
    await wrapper.find('input').setValue('rdcs');
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['rdcs']);
  });

  it('marks required without reading the asterisk aloud', () => {
    const wrapper = mount(Input, { props: { label: 'Name', required: true } });
    expect(wrapper.find('.r-field__required').attributes('aria-hidden')).toBe('true');
    expect(wrapper.find('input').attributes('required')).toBeDefined();
  });

  it('renders help text', () => {
    const wrapper = mount(Input, { props: { label: 'Name', description: 'Lowercase, no spaces.' } });
    expect(wrapper.find('.r-field__hint').text()).toBe('Lowercase, no spaces.');
  });

  it('marks a read-only field, which is the state that carries a treatment', () => {
    const wrapper = mount(Input, { props: { label: 'Rate', readonly: true } });
    expect(wrapper.classes()).toContain('r-field--readonly');
  });

  it('leaves an ordinary field unmarked — editable is not a visual state', () => {
    const wrapper = mount(Input, { props: { label: 'Rate' } });
    expect(wrapper.classes()).not.toContain('r-field--readonly');
    expect(wrapper.classes()).not.toContain('r-field--disabled');
  });

  /*
   * `editable` is deprecated and paints nothing, but it is still accepted so
   * the consuming apps keep compiling. Asserting that it moves no visual state
   * is what stops the tint creeping back.
   */
  it('accepts the deprecated editable prop without marking the field read-only', () => {
    const wrapper = mount(Input, { props: { label: 'Rate', editable: true } });
    expect(wrapper.classes()).not.toContain('r-field--readonly');
  });

  it('does not treat a read-only field as editable', () => {
    const wrapper = mount(Input, { props: { label: 'Rate', editable: true, readonly: true } });
    expect(wrapper.classes()).toContain('r-field--readonly');
    expect(wrapper.classes()).not.toContain('r-field--editable');
  });

  it('clears the value when clearable and the clear control is used', async () => {
    const wrapper = mount(Input, { props: { label: 'Name', modelValue: 'rdcs', clearable: true } });
    const clear = wrapper.find('.r-field__clear');
    expect(clear.exists()).toBe(true);
    expect(clear.attributes('tabindex')).toBe('-1');
    await clear.trigger('click');
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([undefined]);
  });

  it('clears on Escape while focused when clearable', async () => {
    const wrapper = mount(Input, { props: { label: 'Name', modelValue: 'rdcs', clearable: true } });
    await wrapper.find('.r-field__control').trigger('keydown', { key: 'Escape' });
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([undefined]);
  });

  it('does not swallow Escape when empty', async () => {
    const wrapper = mount(Input, { props: { label: 'Name', modelValue: '', clearable: true } });
    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    wrapper.find('.r-field__control').element.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
  });

  /*
   * v0's Input.Control always applies `type` from Input.Root (default "text")
   * and overwrites a `:type` on Control. Password fields (secret reveal/hide)
   * must therefore set type on Root — this pins that wiring.
   */
  it('forwards type to the native input (password masking)', async () => {
    const wrapper = mount(Input, {
      props: { label: 'Secret', modelValue: 's3cret', type: 'password' },
    });
    expect(wrapper.find('input').attributes('type')).toBe('password');

    await wrapper.setProps({ type: 'text' });
    expect(wrapper.find('input').attributes('type')).toBe('text');

    await wrapper.setProps({ type: 'password' });
    expect(wrapper.find('input').attributes('type')).toBe('password');
  });
});

/*
 * Read-only across the controls that cannot simply hand `readonly` to a native
 * input. The rule they share: the interactive machinery is not rendered at all
 * rather than rendered and then ignored — a chevron that opens nothing reads as
 * broken, not as read-only.
 */
describe('read-only controls', () => {
  const options = [
    { value: 'qld', label: 'QLD1' },
    { value: 'nsw', label: 'NSW1' },
  ];

  it('Select shows the selected label and no listbox trigger', () => {
    const wrapper = mount(Select, {
      props: { label: 'Region', options, modelValue: 'nsw', readonly: true },
    });
    expect(wrapper.classes()).toContain('r-field--readonly');
    expect(wrapper.find('.r-field__readonly').exists()).toBe(true);
    // The value lives in an input, so it is a value and not text content.
    expect(wrapper.find<HTMLInputElement>('input.r-field__readonly-input').element.value).toBe('NSW1');
    expect(wrapper.find('.r-select__trigger').exists()).toBe(false);
  });

  it('Select marks an unset value rather than rendering an empty box', () => {
    const wrapper = mount(Select, { props: { label: 'Region', options, readonly: true } });
    const input = wrapper.find<HTMLInputElement>('input.r-field__readonly-input');
    // A placeholder, not a value: the dash marks "not set" on screen without
    // ending up on the clipboard of anyone who copies the field.
    expect(input.attributes('placeholder')).toBe('—');
    expect(input.element.value).toBe('');
  });

  it('Select read-only value is a tab stop that can be copied from', () => {
    const wrapper = mount(Select, {
      props: { label: 'Region', options, modelValue: 'nsw', readonly: true },
    });
    const input = wrapper.find<HTMLInputElement>('input.r-field__readonly-input');
    expect(input.attributes('readonly')).toBeDefined();
    // Not tabindex="-1", and not a div: a readonly input is reachable by Tab
    // and its text is selectable, which a focusable div's is not.
    expect(input.attributes('tabindex')).toBeUndefined();
  });

  it('Select read-only value is named by the field label', () => {
    const wrapper = mount(Select, {
      props: { label: 'Region', options, modelValue: 'nsw', readonly: true },
    });
    const id = wrapper.find('input.r-field__readonly-input').attributes('id');
    expect(id).toBeTruthy();
    // <label for> binds only to labelable elements — aimed at the old div it
    // silently named nothing, and the field reached a screen reader unnamed.
    expect(wrapper.find('label.r-field__label').attributes('for')).toBe(id);
  });

  it('Select still renders its trigger when not read-only', () => {
    const wrapper = mount(Select, { props: { label: 'Region', options, modelValue: 'nsw' } });
    expect(wrapper.find('.r-select__trigger').exists()).toBe(true);
    expect(wrapper.classes()).not.toContain('r-field--readonly');
  });

  it('Select withholds the clear control while read-only', () => {
    const wrapper = mount(Select, {
      props: { label: 'Region', options, modelValue: 'nsw', clearable: true, readonly: true },
    });
    expect(wrapper.find('.r-select__clear').exists()).toBe(false);
  });

  it('MultiSelect keeps its chips but drops the menu and the clear control', () => {
    const wrapper = mount(MultiSelect, {
      props: { label: 'Regions', options, modelValue: ['qld', 'nsw'], readonly: true },
    });
    expect(wrapper.classes()).toContain('r-field--readonly');
    expect(wrapper.text()).toContain('QLD1');
    expect(wrapper.text()).toContain('NSW1');
    expect(wrapper.find('.r-multiselect__trigger').exists()).toBe(false);
    expect(wrapper.find('.r-multiselect__clear').exists()).toBe(false);
  });

  it('TagsInput keeps the tags but withdraws the draft input and the remove buttons', () => {
    const wrapper = mount(TagsInput, {
      props: { label: 'Tags', modelValue: ['peak', 'shoulder'], readonly: true },
    });
    expect(wrapper.classes()).toContain('r-field--readonly');
    expect(wrapper.text()).toContain('peak');
    expect(wrapper.find('.r-tags__input').exists()).toBe(false);
    expect(wrapper.find('.r-tags__remove').exists()).toBe(false);
  });

  it('TagsInput still edits when not read-only', () => {
    const wrapper = mount(TagsInput, { props: { label: 'Tags', modelValue: ['peak'] } });
    expect(wrapper.find('.r-tags__input').exists()).toBe(true);
    expect(wrapper.find('.r-tags__remove').exists()).toBe(true);
  });

  it('KeyValueEditor drops the remove column entirely rather than leaving it empty', () => {
    const wrapper = mount(KeyValueEditor, {
      props: { label: 'Headers', modelValue: { Accept: 'application/json' }, readonly: true },
    });
    expect(wrapper.classes()).toContain('r-field--readonly');
    expect(wrapper.findAll('thead th')).toHaveLength(2);
    expect(wrapper.find('.r-kv__remove').exists()).toBe(false);
    expect(wrapper.findAll('.r-kv__input').every((i) => 'readonly' in i.attributes())).toBe(true);
  });

  it('KeyValueEditor keeps its remove column when editable', () => {
    const wrapper = mount(KeyValueEditor, {
      props: { label: 'Headers', modelValue: { Accept: 'application/json' } },
    });
    expect(wrapper.findAll('thead th')).toHaveLength(3);
    expect(wrapper.find('.r-kv__remove').exists()).toBe(true);
  });
});
