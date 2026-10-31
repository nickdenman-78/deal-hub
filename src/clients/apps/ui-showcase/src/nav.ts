import type { RouteComponent } from 'vue-router';

/**
 * Single source of truth for showcase sidebar + leaf routes.
 * Blade nested children are declared beside the Patterns leaf in router.ts.
 */

export type NavLeaf = {
  kind: 'leaf';
  title: string;
  path: string;
  load: () => Promise<RouteComponent>;
  /** Highlight when the current path is under this leaf (blade stack). */
  match?: 'exact' | 'prefix';
  /** Edge-to-edge under the toolbar (list page, blade stack). */
  flush?: boolean;
};

export type NavGroup = {
  kind: 'group';
  title: string;
  children: NavLeaf[];
};

export type NavSection = {
  kind: 'section';
  title: string;
  children: Array<NavLeaf | NavGroup>;
};

export type NavEntry = NavLeaf | NavSection;

export function isNavGroup(node: NavLeaf | NavGroup): node is NavGroup {
  return node.kind === 'group';
}

export function isNavSection(entry: NavEntry): entry is NavSection {
  return entry.kind === 'section';
}

function leaf(
  title: string,
  path: string,
  load: () => Promise<RouteComponent>,
  options: { match?: 'exact' | 'prefix'; flush?: boolean } = {},
): NavLeaf {
  return {
    kind: 'leaf',
    title,
    path,
    load,
    match: options.match ?? 'exact',
    flush: options.flush,
  };
}

function group(title: string, children: NavLeaf[]): NavGroup {
  return { kind: 'group', title, children };
}

function section(title: string, children: Array<NavLeaf | NavGroup>): NavSection {
  return { kind: 'section', title, children };
}

export const nav: NavEntry[] = [
  leaf('Foundations', '/foundations', () => import('./views/FoundationsView.vue')),

  section('Components', [
    group('Actions', [
      leaf('Button', '/components/button', () => import('./views/components/ButtonView.vue')),
      leaf('ThemeToggle', '/components/theme-toggle', () => import('./views/components/ThemeToggleView.vue')),
    ]),
    group('Forms', [
      leaf('AbnAcnInput', '/components/abn-acn-input', () => import('./views/components/AbnAcnInputView.vue')),
      leaf('Checkbox', '/components/checkbox', () => import('./views/components/CheckboxView.vue')),
      leaf('Combobox', '/components/combobox', () => import('./views/components/ComboboxView.vue')),
      leaf(
        'CreditCardInput',
        '/components/credit-card-input',
        () => import('./views/components/CreditCardInputView.vue'),
      ),
      leaf('CronEditor', '/components/cron-editor', () => import('./views/components/CronEditorView.vue')),
      leaf('DatePicker', '/components/date-picker', () => import('./views/components/DatePickerView.vue')),
      leaf('Dropzone', '/components/dropzone', () => import('./views/components/DropzoneView.vue')),
      leaf('DurationInput', '/components/duration-input', () => import('./views/components/DurationInputView.vue')),
      leaf('Input', '/components/input', () => import('./views/components/InputView.vue')),
      leaf('Ipv4Editor', '/components/ipv4-editor', () => import('./views/components/Ipv4EditorView.vue')),
      leaf('MaskedInput', '/components/masked-input', () => import('./views/components/MaskedInputView.vue')),
      leaf('MonthPicker', '/components/month-picker', () => import('./views/components/MonthPickerView.vue')),
      leaf('MultiSelect', '/components/multi-select', () => import('./views/components/MultiSelectView.vue')),
      leaf('NmiInput', '/components/nmi-input', () => import('./views/components/NmiInputView.vue')),
      leaf('NumberInput', '/components/number-input', () => import('./views/components/NumberInputView.vue')),
      leaf('RadioGroup', '/components/radio-group', () => import('./views/components/RadioGroupView.vue')),
      leaf('Select', '/components/select', () => import('./views/components/SelectView.vue')),
      leaf('Switch', '/components/switch', () => import('./views/components/SwitchView.vue')),
      leaf('TagsInput', '/components/tags-input', () => import('./views/components/TagsInputView.vue')),
      leaf('Textarea', '/components/textarea', () => import('./views/components/TextareaView.vue')),
      leaf('TimePicker', '/components/time-picker', () => import('./views/components/TimePickerView.vue')),
      leaf('ToggleGroup', '/components/toggle-group', () => import('./views/components/ToggleGroupView.vue')),
    ]),
    group('Feedback', [
      leaf('Badge', '/components/badge', () => import('./views/components/BadgeView.vue')),
      leaf('Card', '/components/card', () => import('./views/components/CardView.vue')),
      leaf('EmptyState', '/components/empty-state', () => import('./views/components/EmptyStateView.vue')),
      leaf('Message', '/components/message', () => import('./views/components/MessageView.vue')),
      leaf('ProgressBar', '/components/progress-bar', () => import('./views/components/ProgressBarView.vue')),
      leaf('Skeleton', '/components/skeleton', () => import('./views/components/SkeletonView.vue')),
      leaf('Spinner', '/components/spinner', () => import('./views/components/SpinnerView.vue')),
      leaf('Tag', '/components/tag', () => import('./views/components/TagView.vue')),
    ]),
    group('Overlays', [
      leaf('Confirm', '/components/confirm', () => import('./views/components/ConfirmView.vue')),
      leaf('ConfirmDialog', '/components/confirm-dialog', () => import('./views/components/ConfirmDialogView.vue')),
      leaf('ContextMenu', '/components/context-menu', () => import('./views/components/ContextMenuView.vue')),
      leaf('Dialog', '/components/dialog', () => import('./views/components/DialogView.vue')),
      leaf('Drawer', '/components/drawer', () => import('./views/components/DrawerView.vue')),
      leaf(
        'IdleLogoutDialog',
        '/components/idle-logout-dialog',
        () => import('./views/components/IdleLogoutDialogView.vue'),
      ),
      leaf('Menu', '/components/menu', () => import('./views/components/MenuView.vue')),
      leaf('Popover', '/components/popover', () => import('./views/components/PopoverView.vue')),
      leaf('Toast', '/components/toast', () => import('./views/components/ToastView.vue')),
      leaf('Tooltip', '/components/tooltip', () => import('./views/components/TooltipView.vue')),
    ]),
    group('Data', [
      leaf('ColumnPicker', '/components/column-picker', () => import('./views/components/ColumnPickerView.vue')),
      leaf('DataTable', '/components/data-table', () => import('./views/components/DataTableView.vue')),
      leaf('DefinitionList', '/components/definition-list', () => import('./views/components/DefinitionListView.vue')),
      leaf('Pagination', '/components/pagination', () => import('./views/components/PaginationView.vue')),
      leaf('Tree', '/components/tree', () => import('./views/components/TreeView.vue')),
    ]),
    group('Navigation', [
      leaf('Accordion', '/components/accordion', () => import('./views/components/AccordionView.vue')),
      leaf('Breadcrumbs', '/components/breadcrumbs', () => import('./views/components/BreadcrumbsView.vue')),
      leaf('CommandRail', '/components/command-rail', () => import('./views/components/CommandRailView.vue')),
      leaf('EditorTabs', '/components/editor-tabs', () => import('./views/components/EditorTabsView.vue')),
      leaf('MegaMenu', '/components/mega-menu', () => import('./views/components/MegaMenuView.vue')),
      leaf('Stepper', '/components/stepper', () => import('./views/components/StepperView.vue')),
      leaf('Tabs', '/components/tabs', () => import('./views/components/TabsView.vue')),
    ]),
    group('Display', [
      leaf('Avatar', '/components/avatar', () => import('./views/components/AvatarView.vue')),
      leaf(
        'GradientDivider',
        '/components/gradient-divider',
        () => import('./views/components/GradientDividerView.vue'),
      ),
      leaf('Icon', '/components/icon', () => import('./views/components/IconView.vue')),
      leaf('PageHeader', '/components/page-header', () => import('./views/components/PageHeaderView.vue')),
      leaf('Splitter', '/components/splitter', () => import('./views/components/SplitterView.vue')),
      leaf('Timeline', '/components/timeline', () => import('./views/components/TimelineView.vue')),
    ]),
    group('Composite', [
      leaf(
        'DateRangePicker',
        '/components/date-range-picker',
        () => import('./views/components/DateRangePickerView.vue'),
      ),
      leaf(
        'DateRangeSelector',
        '/components/date-range-selector',
        () => import('./views/components/DateRangeSelectorView.vue'),
      ),
      leaf('DateTimePicker', '/components/date-time-picker', () => import('./views/components/DateTimePickerView.vue')),
      leaf('KeyValueEditor', '/components/key-value-editor', () => import('./views/components/KeyValueEditorView.vue')),
      leaf('ScheduleEditor', '/components/schedule-editor', () => import('./views/components/ScheduleEditorView.vue')),
    ]),
    group('Composables', [
      leaf('useClock', '/components/use-clock', () => import('./views/components/UseClockView.vue')),
    ]),
  ]),

  section('Editors', [
    leaf('DiffViewer', '/editors/diff-viewer', () => import('./views/editors/DiffViewerView.vue')),
    leaf('JsonEditor', '/editors/json-editor', () => import('./views/editors/JsonEditorView.vue')),
    leaf('MarkdownEditor', '/editors/markdown-editor', () => import('./views/editors/MarkdownEditorView.vue')),
    leaf('MarkdownExcerpt', '/editors/markdown-excerpt', () => import('./views/editors/MarkdownExcerptView.vue')),
    leaf('MarkdownView', '/editors/markdown-view', () => import('./views/editors/MarkdownViewView.vue')),
    leaf('MergeEditor', '/editors/merge-editor', () => import('./views/editors/MergeEditorView.vue')),
    leaf(
      'SimpleMarkdownEditor',
      '/editors/simple-markdown-editor',
      () => import('./views/editors/SimpleMarkdownEditorView.vue'),
    ),
  ]),

  section('Patterns', [
    leaf('Blade stack', '/patterns/blade-stack', () => import('./views/BladesView.vue'), {
      match: 'prefix',
      flush: true,
    }),
    leaf('App layout', '/patterns/app-layout', () => import('./views/patterns/AppLayoutView.vue'), {
      flush: true,
    }),
    leaf('List page', '/patterns/list-page', () => import('./views/patterns/ListPageView.vue'), { flush: true }),
    leaf('Deal capture', '/patterns/deal-capture', () => import('./views/patterns/deals/DealCaptureView.vue'), {
      match: 'prefix',
      flush: true,
    }),
  ]),
];

/** Flat leaves for router generation (hub is separate). */
export function allLeaves(entries: NavEntry[] = nav): NavLeaf[] {
  const out: NavLeaf[] = [];
  for (const entry of entries) {
    if (entry.kind === 'leaf') {
      out.push(entry);
      continue;
    }
    for (const child of entry.children) {
      if (child.kind === 'group') out.push(...child.children);
      else out.push(child);
    }
  }
  return out;
}

/** One searchable specimen — section / group give the popover result context. */
export type SearchItem = {
  title: string;
  path: string;
  section: string;
  group?: string;
};

/** Flat index for the showcase search popover (every leaf under `nav`). */
export function searchItems(entries: NavEntry[] = nav): SearchItem[] {
  const out: SearchItem[] = [];
  for (const entry of entries) {
    if (entry.kind === 'leaf') {
      out.push({ title: entry.title, path: entry.path, section: entry.title });
      continue;
    }
    for (const child of entry.children) {
      if (child.kind === 'group') {
        for (const leaf of child.children) {
          out.push({
            title: leaf.title,
            path: leaf.path,
            section: entry.title,
            group: child.title,
          });
        }
      } else {
        out.push({ title: child.title, path: child.path, section: entry.title });
      }
    }
  }
  return out;
}

export function leafMatches(item: NavLeaf, path: string): boolean {
  if (item.match === 'prefix') {
    return path === item.path || path.startsWith(`${item.path}/`);
  }
  return path === item.path;
}

/** Flatten every leaf under a section (groups included). */
export function sectionLeaves(section: NavSection): NavLeaf[] {
  const out: NavLeaf[] = [];
  for (const child of section.children) {
    if (isNavGroup(child)) out.push(...child.children);
    else out.push(child);
  }
  return out;
}

function firstLeafPath(section: NavSection): string {
  const leaves = sectionLeaves(section);
  const first = leaves[0];
  if (!first) throw new Error(`Section "${section.title}" has no leaves`);
  return first.path;
}

/**
 * Top-level rail entries for the showcase shell. Selecting one navigates to
 * its landing path; the submenu shows either flat leaves or group mega-menus.
 */
export type NavTopLevel = {
  id: string;
  title: string;
  icon: string;
  path: string;
  /** Flat leaves (matching + flat submenu when `groups` is empty). */
  leaves: NavLeaf[];
  /** Logical groups — submenu shows these as mega-menu triggers when non-empty. */
  groups: NavGroup[];
};

export const topLevels: NavTopLevel[] = [
  { id: 'home', title: 'Home', icon: 'package', path: '/', leaves: [], groups: [] },
  {
    id: 'foundations',
    title: 'Foundations',
    icon: 'book',
    path: '/foundations',
    leaves: [],
    groups: [],
  },
  ...nav.filter(isNavSection).map((section) => ({
    id: section.title.toLowerCase(),
    title: section.title,
    icon: sectionIcon(section.title),
    path: firstLeafPath(section),
    leaves: sectionLeaves(section),
    groups: section.children.filter(isNavGroup),
  })),
];

function sectionIcon(title: string): string {
  switch (title) {
    case 'Components':
      return 'square-code';
    case 'Editors':
      return 'pencil';
    case 'Patterns':
      return 'columns-3';
    default:
      return 'folder';
  }
}

/** Active rail entry for the current path (most specific wins). */
export function activeTopLevel(path: string): NavTopLevel {
  if (path === '/' || path === '') return topLevels[0]!;
  if (path === '/foundations' || path.startsWith('/foundations/')) {
    return topLevels.find((t) => t.id === 'foundations') ?? topLevels[0]!;
  }
  for (const entry of topLevels) {
    if (entry.leaves.some((leaf) => leafMatches(leaf, path))) return entry;
  }
  return topLevels[0]!;
}

/** Hub highlight cards — curated entry points, not the full sitemap. */
export const hubHighlights: { title: string; path: string; note: string }[] = [
  { title: 'Button', path: '/components/button', note: 'Variants, sizes, icons, busy.' },
  { title: 'DataTable', path: '/components/data-table', note: 'Sort, search, filters, groups, drill-down.' },
  { title: 'Blade stack', path: '/patterns/blade-stack', note: 'Nested routes are the stack.' },
  { title: 'App layout', path: '/patterns/app-layout', note: 'Topbar, sidebar rail, scrollable main.' },
  {
    title: 'SimpleMarkdownEditor',
    path: '/editors/simple-markdown-editor',
    note: 'TipTap rich text, markdown value.',
  },
];

export const hubSections: { title: string; path: string; note: string }[] = [
  { title: 'Foundations', path: '/foundations', note: 'Colour, type, spacing, elevation.' },
  { title: 'Components', path: '/components/button', note: 'Every @ets/ui control, one page each.' },
  { title: 'Editors', path: '/editors/json-editor', note: 'Monaco and TipTap, separate chunks.' },
  { title: 'Patterns', path: '/patterns/blade-stack', note: 'Page shapes built from the primitives.' },
];
