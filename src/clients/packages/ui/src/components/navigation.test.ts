import { mount } from '@vue/test-utils';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { nextTick, type Component } from 'vue';
import { registerEtsIcons } from '../icons';
import Avatar from './Avatar.vue';
import Breadcrumbs from './Breadcrumbs.vue';
import ContextMenu from './ContextMenu.vue';
import DatePicker from './DatePicker.vue';
import TimePicker from './TimePicker.vue';
import ToggleGroup from './ToggleGroup.vue';
import Tree from './Tree.vue';

beforeAll(() => registerEtsIcons());

describe('Avatar', () => {
  it('takes the first letter of the first two words', () => {
    expect(mount(Avatar, { props: { name: 'Anna Bell Carter' } }).text()).toBe('AB');
  });

  it('handles a single-word name', () => {
    expect(mount(Avatar, { props: { name: 'anonymous' } }).text()).toBe('A');
  });

  it('names itself for assistive tech, since initials alone say nothing', () => {
    const wrapper = mount(Avatar, { props: { name: 'Anna Bell' } });
    expect(wrapper.attributes('role')).toBe('img');
    expect(wrapper.attributes('aria-label')).toBe('Anna Bell');
  });
});

describe('Breadcrumbs', () => {
  const items = [
    { label: 'Services', to: '/services' },
    { label: 'pricing-api', to: '/services/pricing-api' },
    { label: 'Keys' },
  ];

  it('links every crumb except the last', () => {
    const wrapper = mount(Breadcrumbs, {
      props: { items },
      global: { stubs: { RouterLink: { template: '<a><slot/></a>' } } },
    });
    expect(wrapper.findAll('a')).toHaveLength(2);
  });

  /* Without aria-current a screen reader hears a list of links with no
     indication which one is the page you are on. */
  it('marks the final crumb as the current page', () => {
    const wrapper = mount(Breadcrumbs, {
      props: { items },
      global: { stubs: { RouterLink: { template: '<a><slot/></a>' } } },
    });
    const current = wrapper.find('[aria-current="page"]');
    expect(current.exists()).toBe(true);
    expect(current.text()).toBe('Keys');
  });
});

describe('ToggleGroup', () => {
  const options = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'retired', label: 'Retired', disabled: true },
  ];

  it('reports selection through aria-pressed, which the styling reads', async () => {
    const wrapper = mount(ToggleGroup as unknown as Component, {
      props: { options, label: 'Filter', modelValue: 'all' },
    });
    const items = wrapper.findAll('.r-toggles__item');

    expect(items[0].attributes('aria-pressed')).toBe('true');
    expect(items[1].attributes('aria-pressed')).toBe('false');

    await items[1].trigger('click');
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['active']);
  });

  it('marks a disabled option', () => {
    const wrapper = mount(ToggleGroup as unknown as Component, {
      props: { options, label: 'Filter' },
    });
    expect(wrapper.findAll('.r-toggles__item')[2].attributes('aria-disabled')).toBe('true');
  });
});

describe('Tree', () => {
  const items = [
    {
      id: 'trading',
      label: 'Trading',
      children: [
        { id: 'pricing', label: 'pricing-api' },
        { id: 'deals', label: 'deals-sync' },
      ],
    },
    { id: 'billing', label: 'Billing', children: [{ id: 'run', label: 'billing-run' }] },
  ];

  it('renders nested nodes recursively', () => {
    const wrapper = mount(Tree, { props: { items, label: 'Services', openAll: true } });
    expect(wrapper.text()).toContain('pricing-api');
    expect(wrapper.text()).toContain('billing-run');
  });

  it('exposes tree semantics', () => {
    const wrapper = mount(Tree, { props: { items, label: 'Services' } });
    expect(wrapper.find('[role="tree"]').exists()).toBe(true);
    expect(wrapper.findAll('[role="treeitem"]').length).toBeGreaterThan(0);
  });

  it('lets a slot replace a node label', () => {
    const wrapper = mount(Tree, {
      props: { items, label: 'Services', openAll: true },
      slots: { node: '<b class="custom">{{ params.item.label }}</b>' },
    });
    expect(wrapper.find('b.custom').exists()).toBe(true);
  });
});

describe('DatePicker', () => {
  /*
   * The model is an ISO string, not a Date. `new Date('2026-01-01')` parses as
   * UTC midnight, so anywhere behind UTC renders the previous day — a bug that
   * only appears for some users, in some timezones.
   */
  it('round-trips an ISO date string through a native input', async () => {
    const wrapper = mount(DatePicker, { props: { label: 'Expires', modelValue: '2026-03-01' } });
    const input = wrapper.find('input[type="date"]');

    expect(input.exists()).toBe(true);
    expect((input.element as HTMLInputElement).value).toBe('2026-03-01');

    await input.setValue('2026-04-15');
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['2026-04-15']);
  });

  it('associates its label and passes min/max through', () => {
    const wrapper = mount(DatePicker, { props: { label: 'Expires', min: '2026-01-01', max: '2026-12-31' } });
    const input = wrapper.find('input');
    expect(wrapper.find('label').attributes('for')).toBe(input.attributes('id'));
    expect(input.attributes('min')).toBe('2026-01-01');
    expect(input.attributes('max')).toBe('2026-12-31');
  });

  /*
   * The leading icon opens the chooser via showPicker(); the native indicator
   * is hidden so it cannot sit in front of the dateparts. Escape must dismiss
   * without also closing a blade, and focus the input so Chromium selects the
   * first datepart for type-to-replace.
   */
  it('opens the chooser from the calendar button', async () => {
    const wrapper = mount(DatePicker, {
      props: { label: 'Expires', modelValue: '2026-03-01' },
      attachTo: document.body,
    });
    const input = wrapper.find('input').element as HTMLInputElement;
    const showPicker = vi.fn();
    Object.defineProperty(input, 'showPicker', { configurable: true, value: showPicker });

    await wrapper.find('button[aria-label="Open calendar"]').trigger('click');
    expect(showPicker).toHaveBeenCalledOnce();

    wrapper.unmount();
  });

  it('opens the chooser from control chrome, but not from a datepart click', async () => {
    const wrapper = mount(DatePicker, {
      props: { label: 'Expires', modelValue: '2026-03-01' },
      attachTo: document.body,
    });
    const input = wrapper.find('input').element as HTMLInputElement;
    const showPicker = vi.fn();
    Object.defineProperty(input, 'showPicker', { configurable: true, value: showPicker });

    await wrapper.find('input[type="date"]').trigger('click');
    expect(showPicker).not.toHaveBeenCalled();

    await wrapper.find('.r-date__control').trigger('click');
    expect(showPicker).toHaveBeenCalledOnce();

    wrapper.unmount();
  });

  it('on Escape after opening the chooser, focuses the input and prevents default', async () => {
    const wrapper = mount(DatePicker, {
      props: { label: 'Expires', modelValue: '2026-03-01' },
      attachTo: document.body,
    });
    const input = wrapper.find('input').element as HTMLInputElement;
    Object.defineProperty(input, 'showPicker', { configurable: true, value: vi.fn() });

    await wrapper.find('button[aria-label="Open calendar"]').trigger('click');

    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    wrapper.element.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);

    await Promise.resolve();
    expect(document.activeElement).toBe(input);

    wrapper.unmount();
  });

  it('does not swallow Escape when the chooser was not opened', () => {
    const wrapper = mount(DatePicker, {
      props: { label: 'Expires', modelValue: '2026-03-01' },
      attachTo: document.body,
    });

    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    wrapper.element.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);

    wrapper.unmount();
  });

  /*
   * Chrome Tabs between dateparts; Edge leaves the field. We standardise on
   * Edge / APG: one stop, arrows between parts.
   */
  it('Tab leaves the field for the next control', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    host.innerHTML = `<input id="before" /><div id="mount"></div><input id="after" />`;

    const wrapper = mount(DatePicker, {
      props: { label: 'Expires', modelValue: '2026-03-01' },
      attachTo: host.querySelector('#mount')!,
    });
    const input = wrapper.find('input[type="date"]').element as HTMLInputElement;
    input.focus();

    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    input.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement?.id).toBe('after');

    wrapper.unmount();
    host.remove();
  });

  it('Shift+Tab leaves the field for the previous control', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    host.innerHTML = `<input id="before" /><div id="mount"></div><input id="after" />`;

    const wrapper = mount(DatePicker, {
      props: { label: 'Expires', modelValue: '2026-03-01' },
      attachTo: host.querySelector('#mount')!,
    });
    const input = wrapper.find('input[type="date"]').element as HTMLInputElement;
    input.focus();

    const event = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    });
    input.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement?.id).toBe('before');

    wrapper.unmount();
    host.remove();
  });

  it('shows a field error when the input reports badInput', async () => {
    const wrapper = mount(DatePicker, {
      props: { label: 'Expires', modelValue: '2026-03-01' },
      attachTo: document.body,
    });
    const input = wrapper.find('input').element as HTMLInputElement;
    Object.defineProperty(input, 'validity', {
      configurable: true,
      get: () =>
        ({
          badInput: true,
          rangeUnderflow: false,
          rangeOverflow: false,
          valid: false,
        }) as ValidityState,
    });

    await wrapper.find('input').trigger('input');
    expect(wrapper.find('.r-field__error').text()).toBe('Enter a valid calendar date.');
    expect(wrapper.find('input').attributes('aria-invalid')).toBe('true');

    wrapper.unmount();
  });

  it('rejects a weekend when disabledWeekdays is set', async () => {
    const wrapper = mount(DatePicker, {
      props: {
        label: 'Business day',
        modelValue: '2026-07-04', // Saturday
        disabledWeekdays: [0, 6],
      },
      attachTo: document.body,
    });

    await wrapper.find('input').trigger('input');
    expect(wrapper.find('.r-field__error').text()).toBe('Weekends are not available.');

    wrapper.unmount();
  });

  it('rejects a holiday in disabledDates', async () => {
    const wrapper = mount(DatePicker, {
      props: {
        label: 'Business day',
        modelValue: '2026-12-25',
        disabledDates: ['2026-12-25', '2026-12-26'],
      },
      attachTo: document.body,
    });

    await wrapper.find('input').trigger('input');
    expect(wrapper.find('.r-field__error').text()).toBe('This date is unavailable.');

    wrapper.unmount();
  });
});

describe('TimePicker', () => {
  it('round-trips an HH:mm string through a native input', async () => {
    const wrapper = mount(TimePicker, { props: { label: 'Starts', modelValue: '09:30' } });
    const input = wrapper.find('input[type="time"]');

    expect(input.exists()).toBe(true);
    expect((input.element as HTMLInputElement).value).toBe('09:30');

    await input.setValue('14:15');
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['14:15']);
  });

  it('associates its label and passes min/max/step through', () => {
    const wrapper = mount(TimePicker, {
      props: { label: 'Starts', min: '09:00', max: '17:00', step: 1 },
    });
    const input = wrapper.find('input');
    expect(wrapper.find('label').attributes('for')).toBe(input.attributes('id'));
    expect(input.attributes('min')).toBe('09:00');
    expect(input.attributes('max')).toBe('17:00');
    expect(input.attributes('step')).toBe('1');
  });

  it('opens the chooser from the clock button', async () => {
    const wrapper = mount(TimePicker, {
      props: { label: 'Starts', modelValue: '09:00' },
      attachTo: document.body,
    });
    const input = wrapper.find('input').element as HTMLInputElement;
    const showPicker = vi.fn();
    Object.defineProperty(input, 'showPicker', { configurable: true, value: showPicker });

    await wrapper.find('button[aria-label="Open time picker"]').trigger('click');
    expect(showPicker).toHaveBeenCalledOnce();

    wrapper.unmount();
  });

  it('opens the chooser from control chrome, but not from a timepart click', async () => {
    const wrapper = mount(TimePicker, {
      props: { label: 'Starts', modelValue: '09:00' },
      attachTo: document.body,
    });
    const input = wrapper.find('input').element as HTMLInputElement;
    const showPicker = vi.fn();
    Object.defineProperty(input, 'showPicker', { configurable: true, value: showPicker });

    await wrapper.find('input[type="time"]').trigger('click');
    expect(showPicker).not.toHaveBeenCalled();

    await wrapper.find('.r-time__control').trigger('click');
    expect(showPicker).toHaveBeenCalledOnce();

    wrapper.unmount();
  });

  it('on Escape after opening the chooser, focuses the input and prevents default', async () => {
    const wrapper = mount(TimePicker, {
      props: { label: 'Starts', modelValue: '09:00' },
      attachTo: document.body,
    });
    const input = wrapper.find('input').element as HTMLInputElement;
    Object.defineProperty(input, 'showPicker', { configurable: true, value: vi.fn() });

    await wrapper.find('button[aria-label="Open time picker"]').trigger('click');

    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    wrapper.element.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);

    await Promise.resolve();
    expect(document.activeElement).toBe(input);

    wrapper.unmount();
  });

  it('Tab leaves the field for the next control', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    host.innerHTML = `<input id="before" /><div id="mount"></div><input id="after" />`;

    const wrapper = mount(TimePicker, {
      props: { label: 'Starts', modelValue: '09:00' },
      attachTo: host.querySelector('#mount')!,
    });
    const input = wrapper.find('input[type="time"]').element as HTMLInputElement;
    input.focus();

    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    input.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement?.id).toBe('after');

    wrapper.unmount();
    host.remove();
  });

  it('shows a field error when the input reports badInput', async () => {
    const wrapper = mount(TimePicker, {
      props: { label: 'Starts', modelValue: '09:00' },
      attachTo: document.body,
    });
    const input = wrapper.find('input').element as HTMLInputElement;
    Object.defineProperty(input, 'validity', {
      configurable: true,
      get: () =>
        ({
          badInput: true,
          rangeUnderflow: false,
          rangeOverflow: false,
          valid: false,
        }) as ValidityState,
    });

    await wrapper.find('input').trigger('input');
    expect(wrapper.find('.r-field__error').text()).toBe('Enter a valid time.');
    expect(wrapper.find('input').attributes('aria-invalid')).toBe('true');

    wrapper.unmount();
  });
});

describe('ContextMenu', () => {
  const items = [
    { label: 'Open', action: () => {} },
    { separator: true },
    { label: 'Delete', destructive: true, action: () => {} },
  ];

  it('stays closed until a contextmenu event', async () => {
    const wrapper = mount(ContextMenu, {
      props: { items },
      slots: { default: '<p>Right-click me</p>' },
      attachTo: document.body,
    });
    expect(document.querySelector('.r-ctxmenu')).toBeNull();

    await wrapper.find('.r-ctxmenu__target').trigger('contextmenu', { clientX: 100, clientY: 100 });
    await nextTick();
    expect(document.querySelectorAll('.r-ctxmenu [role="menuitem"]')).toHaveLength(2);

    wrapper.unmount();
  });

  /* Opened near an edge is exactly where a context menu usually IS opened, so
     clamping is not a nicety. */
  it('clamps its position so it cannot open off-screen', async () => {
    const wrapper = mount(ContextMenu, { props: { items }, slots: { default: '<p>x</p>' }, attachTo: document.body });

    await wrapper.find('.r-ctxmenu__target').trigger('contextmenu', { clientX: 99_999, clientY: 99_999 });
    await nextTick();

    const menu = document.querySelector<HTMLElement>('.r-ctxmenu')!;
    expect(parseInt(menu.style.left, 10)).toBeLessThan(window.innerWidth);
    expect(parseInt(menu.style.top, 10)).toBeLessThan(window.innerHeight);

    wrapper.unmount();
  });
});
