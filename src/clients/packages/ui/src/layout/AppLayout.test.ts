import { mount } from '@vue/test-utils';
import { beforeAll, describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';
import { registerEtsIcons } from '../icons';
import AppLayout from './AppLayout.vue';
import AppNavItem from './AppNavItem.vue';
import AppSidebar from './AppSidebar.vue';
import AppSidebarBrand from './AppSidebarBrand.vue';
import AppTopbar from './AppTopbar.vue';
import type { AppLayoutChrome } from './context';

beforeAll(() => registerEtsIcons());

async function mountShell(
  opts: {
    collapsed?: boolean;
    chrome?: AppLayoutChrome;
    submenu?: boolean;
    path?: string;
  } = {},
) {
  const collapsed = ref(opts.collapsed ?? false);
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div>home</div>' } },
      { path: '/inbox', component: { template: '<div>inbox</div>' } },
      { path: '/settings', component: { template: '<div>settings</div>' } },
    ],
  });
  await router.push(opts.path ?? '/');
  await router.isReady();

  const Root = defineComponent({
    setup() {
      return () =>
        h(
          AppLayout,
          {
            collapsed: collapsed.value,
            'onUpdate:collapsed': (value: boolean) => {
              collapsed.value = value;
            },
            chrome: opts.chrome ?? 'both',
          },
          {
            sidebar: () =>
              h(AppSidebar, null, {
                brand: () => h(AppSidebarBrand, { to: '/', label: 'ETS' }),
                nav: () => [
                  h(AppNavItem, { to: '/inbox', icon: 'inbox', label: 'Inbox' }),
                  h(AppNavItem, { to: '/settings', icon: 'settings', label: 'Settings' }),
                ],
                footer: () => 'footer',
              }),
            topbar: () =>
              h(AppTopbar, null, {
                start: () => 'Page title',
                center: () => 'Search',
                end: () => 'tools',
              }),
            ...(opts.submenu ? { submenu: () => h('nav', { 'aria-label': 'Section' }, 'Submenu') } : {}),
            default: () => h('p', 'Main content'),
          },
        );
    },
  });

  const wrapper = mount(Root, {
    global: { plugins: [router] },
    attachTo: document.body,
  });
  await nextTick();
  return { wrapper, collapsed, router };
}

describe('AppLayout', () => {
  it('renders topbar + sidebar by default (chrome=both)', async () => {
    const { wrapper } = await mountShell();

    expect(wrapper.find('.r-app-layout__topbar').exists()).toBe(true);
    expect(wrapper.find('.r-app-layout__sidebar').exists()).toBe(true);
    expect(wrapper.find('.r-app-layout').classes()).not.toContain('r-app-layout--no-topbar');
    expect(wrapper.find('.r-app-layout').classes()).not.toContain('r-app-layout--no-sidebar');
    expect(wrapper.find('.r-app-topbar__center').text()).toBe('Search');

    wrapper.unmount();
  });

  it('omits the topbar when chrome is sidebar', async () => {
    const { wrapper } = await mountShell({ chrome: 'sidebar' });

    expect(wrapper.find('.r-app-layout__topbar').exists()).toBe(false);
    expect(wrapper.find('.r-app-layout__sidebar').exists()).toBe(true);
    expect(wrapper.find('.r-app-layout').classes()).toContain('r-app-layout--no-topbar');
    expect(wrapper.find('.r-app-layout__main').text()).toContain('Main content');

    wrapper.unmount();
  });

  it('omits the sidebar when chrome is topbar', async () => {
    const { wrapper } = await mountShell({ chrome: 'topbar' });

    expect(wrapper.find('.r-app-layout__topbar').exists()).toBe(true);
    expect(wrapper.find('.r-app-layout__sidebar').exists()).toBe(false);
    expect(wrapper.find('.r-app-layout').classes()).toContain('r-app-layout--no-sidebar');
    expect(wrapper.find('.r-app-sidebar__collapse').exists()).toBe(false);

    wrapper.unmount();
  });

  it('renders an optional submenu above the main scrollport', async () => {
    const { wrapper } = await mountShell({ submenu: true });

    const submenu = wrapper.find('.r-app-layout__submenu');
    expect(submenu.exists()).toBe(true);
    expect(submenu.text()).toBe('Submenu');
    expect(wrapper.find('.r-app-layout').classes()).toContain('r-app-layout--has-submenu');
    // Submenu is a sibling of main, not inside the scrollport.
    expect(wrapper.find('.r-app-layout__main .r-app-layout__submenu').exists()).toBe(false);

    wrapper.unmount();
  });

  it('toggles collapsed via the sidebar control and marks the rail', async () => {
    const { wrapper, collapsed } = await mountShell({ collapsed: false });

    expect(wrapper.find('.r-app-layout').classes()).not.toContain('r-app-layout--collapsed');
    expect(wrapper.find('.r-app-sidebar').classes()).not.toContain('r-app-sidebar--collapsed');

    const toggle = wrapper.find('.r-app-sidebar__collapse');
    expect(toggle.attributes('aria-label')).toBe('Collapse sidebar');
    await toggle.trigger('click');
    await nextTick();

    expect(collapsed.value).toBe(true);
    expect(wrapper.find('.r-app-layout').classes()).toContain('r-app-layout--collapsed');
    expect(wrapper.find('.r-app-sidebar').classes()).toContain('r-app-sidebar--collapsed');
    expect(wrapper.find('.r-app-sidebar__collapse').attributes('aria-label')).toBe('Expand sidebar');

    wrapper.unmount();
  });
});

describe('AppNavItem', () => {
  it('exposes the label as aria-label in rail mode and hides the visible label', async () => {
    const { wrapper } = await mountShell({ collapsed: true });

    const item = wrapper.find('.r-app-nav-item');
    expect(item.classes()).toContain('r-app-nav-item--rail');
    expect(item.attributes('aria-label')).toBe('Inbox');
    expect(wrapper.find('.r-app-nav-item__label').exists()).toBe(false);

    wrapper.unmount();
  });

  it('shows the label beside the icon when expanded', async () => {
    const { wrapper } = await mountShell({ collapsed: false });

    const item = wrapper.find('.r-app-nav-item');
    expect(item.classes()).not.toContain('r-app-nav-item--rail');
    expect(item.attributes('aria-label')).toBeUndefined();
    expect(item.find('.r-app-nav-item__label').text()).toBe('Inbox');

    wrapper.unmount();
  });
});

describe('AppSidebarBrand', () => {
  it('renders as a home link with the accessible label', async () => {
    const { wrapper } = await mountShell({ collapsed: false });

    const brand = wrapper.find('.r-app-sidebar-brand');
    expect(brand.exists()).toBe(true);
    expect(brand.classes()).not.toContain('r-app-sidebar-brand--rail');
    expect(brand.attributes('aria-label')).toBe('ETS');
    expect(brand.attributes('href')).toBe('/');
    expect(wrapper.findAll('.r-app-sidebar-brand__img')).toHaveLength(3);

    wrapper.unmount();
  });

  it('marks the rail state when the sidebar is collapsed', async () => {
    const { wrapper } = await mountShell({ collapsed: true });

    expect(wrapper.find('.r-app-sidebar-brand').classes()).toContain('r-app-sidebar-brand--rail');

    wrapper.unmount();
  });
});
