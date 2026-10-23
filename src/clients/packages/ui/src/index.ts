/*
 * @ets/ui — ETS-branded Vue components on @vuetify/v0 headless
 * primitives.
 *
 * Consumed as raw source: this barrel and the per-file `exports` subpaths both
 * point at .ts/.vue, and each app's bundler transpiles them. There is no build
 * step, no lib-mode output and no project references. See src/clients/CONTEXT.md.
 *
 * Apps that import this package must add it to `optimizeDeps.exclude` (esbuild
 * cannot prebundle raw SFCs) and add its runtime dependencies — @vuetify/v0 and
 * @iconify/vue — to `optimizeDeps.include`, because Vite's dependency scanner
 * does not crawl into excluded packages.
 *
 * Stylesheets are NOT re-exported here. They are separate subpaths
 * (`@ets/ui/styles/theme.css` and friends) so that import order stays the
 * app's decision — tokens have to be parsed before anything that reads them.
 */

export { default as Accordion } from './components/Accordion.vue';
export { default as AccordionItem } from './components/AccordionItem.vue';
export { default as Avatar } from './components/Avatar.vue';
export { default as AbnAcnInput } from './components/AbnAcnInput.vue';
export type { AbnAcnKind } from './components/abnAcn';
export { detectAbnAcnKind, digitsOnly, maxDigitsForKind } from './components/abnAcn';
export { default as Badge } from './components/Badge.vue';
export type { BadgePosition } from './components/Badge.vue';
export { formatBadgeContent } from './components/badge';
export { ABN_MAX_DIGITS, abnProblem, abnRule, isValidAbn, maskAbn, unformatAbn } from './components/abn';
export { ACN_MAX_DIGITS, acnProblem, acnRule, isValidAcn, maskAcn, unformatAcn } from './components/acn';
export { default as Breadcrumbs } from './components/Breadcrumbs.vue';
export { default as Button } from './components/Button.vue';
export { default as CommandRail } from './components/CommandRail.vue';
export { default as CommandRailGroup } from './components/CommandRailGroup.vue';
export { default as Card } from './components/Card.vue';
export { default as Checkbox } from './components/Checkbox.vue';
export { default as Combobox } from './components/Combobox.vue';
export { default as ConfirmDialog } from './components/ConfirmDialog.vue';
export { default as ConfirmHost } from './components/ConfirmHost.vue';
export { default as ContextMenu } from './components/ContextMenu.vue';
export { default as CreditCardInput } from './components/CreditCardInput.vue';
export {
  CREDIT_CARD_MAX_DIGITS,
  CREDIT_CARD_MIN_DIGITS,
  creditCardProblem,
  creditCardRule,
  maskCreditCard,
  obscureCreditCard,
  unformatCreditCard,
} from './components/creditCard';
export { default as CronEditor } from './components/CronEditor.vue';
export {
  CRON_FIELDS,
  CRON_PRESETS,
  DAY_OF_MONTH_SPECIALS,
  MONTHS,
  WEEKDAYS,
  buildCron,
  cronError,
  describeCron,
  detectShape,
  formatSimpleList,
  isValidCron,
  joinCron,
  nextOccurrences,
  normalizeMonths,
  parseDayOfMonthToken,
  parseSimpleList,
  splitCron,
} from './components/cron';
export type {
  CronFieldDef,
  CronFieldKey,
  CronFieldOption,
  CronParts,
  CronPreset,
  CronShape,
  DayOfMonthValue,
} from './components/cron';
export { default as DatePicker } from './components/DatePicker.vue';
export { WEEKEND_DAYS, dateAvailabilityMessage, dateValidityMessage } from './components/dateValidity';
export type { DateAvailability, Weekday } from './components/dateValidity';
export { default as Dialog } from './components/Dialog.vue';
export { default as Drawer } from './components/Drawer.vue';

/* Click-to-browse + drag-and-drop file intake. Stateless: emits the picked
 * files; what "chosen" looks like belongs to the caller (default slot). */
export { default as Dropzone } from './components/Dropzone.vue';

/* IDE-style multi-document tab strip — not the Tabs compound (section
 * navigation); this is a document list whose entries open and close at
 * runtime. Admitted for editing workbenches; supersedes ADR-0010's rejection. */
export { default as EditorTabs } from './components/EditorTabs.vue';
export type { EditorTab } from './components/EditorTabs.vue';

export { useTableFilters, distinctFilterOptions } from './table/useTableFilters';
export type { TableFilters } from './table/useTableFilters';
export { default as ColumnPicker } from './table/ColumnPicker.vue';
export { csvField, toCsv, exportFileName, downloadCsv } from './table/tableExport';
export { usePersistedTableState } from './table/usePersistedTableState';
export type { TableState, PersistedTableState } from './table/usePersistedTableState';
export { default as DefinitionList } from './components/DefinitionList.vue';
export type { DefinitionItem } from './components/DefinitionList.vue';
export { default as EmptyState } from './components/EmptyState.vue';
export { default as GradientDivider } from './components/GradientDivider.vue';
export type { GradientDividerOrientation } from './components/GradientDivider.vue';
export { default as Icon } from './components/Icon.vue';
export { default as IdleLogoutDialog } from './components/IdleLogoutDialog.vue';
export { default as Input } from './components/Input.vue';
export { default as MaskedInput } from './components/MaskedInput.vue';
export {
  AU_INTL_MAX_DIGITS,
  AU_LANDLINE_MAX_DIGITS,
  AU_MOBILE_MAX_DIGITS,
  ID_NAME_DESCRIPTION,
  ID_NAME_MAX,
  ID_NAME_MIXED_DESCRIPTION,
  ID_NAME_MIXED_REGEX,
  ID_NAME_REGEX,
  formatCurrency,
  formatDigitGroups,
  idNameProblem,
  idNameRule,
  maskAuIntlPhone,
  maskAuLandline,
  maskAuMobile,
  maskCurrency,
  normalizeIdName,
  rawCurrency,
  unformatAuIntlPhone,
  unformatAuLandline,
  unformatAuMobile,
  unformatCurrency,
} from './components/mask';
export type { MaskFn } from './components/mask';
export { default as MegaMenu } from './components/MegaMenu.vue';
export {
  chunkColumns,
  edgeInBar,
  hasGroupLabels,
  hasPanel,
  moveInBar,
  moveInGrid,
  resolveFlow,
} from './components/megaMenu';
export type {
  MegaMenuEntry,
  MegaMenuFlow,
  MegaMenuGroup,
  MegaMenuItem,
  MegaMenuMove,
  MegaMenuPosition,
} from './components/megaMenu';
export { default as Menu } from './components/Menu.vue';
export { default as Message } from './components/Message.vue';
export { default as MonthPicker } from './components/MonthPicker.vue';
export {
  compareMonth,
  formatMonth,
  isMonthOutOfRange,
  monthLabel,
  monthName,
  monthOfDate,
  monthOrdinal,
  parseMonth,
  shiftMonth,
} from './components/monthValue';
export type { MonthParts } from './components/monthValue';
export { default as MultiSelect } from './components/MultiSelect.vue';
export { default as NmiInput } from './components/NmiInput.vue';
export {
  NMI_BODY_LENGTH,
  NMI_WITH_CHECKSUM_LENGTH,
  isValidNmi,
  maskNmi,
  nmiChecksum,
  nmiProblem,
  nmiRule,
  unformatNmi,
} from './components/nmi';
export { default as NumberInput } from './components/NumberInput.vue';

/* Title row + inline meta + trailing actions, optional identifier subtitle.
 * The domain-free general form of every list/detail heading — apps keep their
 * domain vocabulary in thin local wrappers (see ADR-0010's EntityHeading). */
export { default as PageHeader } from './components/PageHeader.vue';

export { default as Popover } from './components/Popover.vue';
export { default as ProgressBar } from './components/ProgressBar.vue';
export { default as RadioGroup } from './components/RadioGroup.vue';
export { default as Select } from './components/Select.vue';

/* Loading placeholder bars. BladeSkeleton composes these inside blade header
 * wrappers; detail panes compose them directly. */
export { default as Skeleton } from './components/Skeleton.vue';
export type { SkeletonVariant } from './components/Skeleton.vue';

export { default as Spinner } from './components/Spinner.vue';
export { default as Splitter } from './components/Splitter.vue';
export { default as SplitterPanel } from './components/SplitterPanel.vue';

/* Wizard: a gated SEQUENCE, not tabs. Only the active panel renders, and the
 * marker strip doubles as the progress report. See ADR-0021. */
export { default as Stepper } from './components/Stepper.vue';
export { default as StepperPanel } from './components/StepperPanel.vue';
export { isStepNavigable, neighbourStep, stepIndex, stepStatus, stepStatusWord } from './components/stepper';
export type { StepperStatus, StepperStep } from './components/stepper';

export { default as Switch } from './components/Switch.vue';
export { default as Tab } from './components/Tab.vue';
export { default as TabList } from './components/TabList.vue';
export { default as TabPanel } from './components/TabPanel.vue';
export { default as Tabs } from './components/Tabs.vue';
export { default as Tag } from './components/Tag.vue';
export { default as Textarea } from './components/Textarea.vue';
export { default as ThemeToggle } from './components/ThemeToggle.vue';

/* Vertical activity feed (version history, MRU, audit trails). `selectable`
 * turns entries into buttons for version pickers; read-only feeds stay plain. */
export { default as Timeline } from './components/Timeline.vue';
export type { TimelineItem } from './components/Timeline.vue';

export { default as TimePicker } from './components/TimePicker.vue';
export { default as ToastHost } from './components/ToastHost.vue';
export { default as ToggleGroup } from './components/ToggleGroup.vue';
export { default as Tooltip } from './components/Tooltip.vue';
export { default as Tree } from './components/Tree.vue';

export type { Severity, StatusSeverity } from './severity';
export type { Crumb } from './components/Breadcrumbs.vue';
export type { ButtonSeverity, ButtonSize, ButtonVariant, ButtonWeight } from './components/Button.vue';
export type { InputSize } from './components/Input.vue';
export type { MenuItem } from './components/Menu.vue';
export type { MessageSeverity } from './components/Message.vue';
export type { RadioOption } from './components/RadioGroup.vue';
export type { SelectOption } from './components/Select.vue';
export type { TagVariant } from './components/Tag.vue';
export type { ToggleOption } from './components/ToggleGroup.vue';
export type { TreeItem, TreeSelectable, TreeSelectMode } from './components/Tree.vue';

/* The persistence half of Tree's `v-model:open` — same contract-ownership
 * argument as usePersistedRowGroups below. Pass your app's existing
 * storagePrefix when adopting it, or saved expansion resets. */
export { usePersistedTreeExpansion } from './components/usePersistedTreeExpansion';
export type { PersistedTreeExpansion, PersistedTreeExpansionOptions } from './components/usePersistedTreeExpansion';

/*
 * Toasts and confirmations are services: one host in the app shell, called from
 * anywhere. `createNotificationsPlugin` is re-exported so an app installs the
 * v0 plugin ToastHost depends on without importing @vuetify/v0 itself.
 */
export { createNotificationsPlugin } from '@vuetify/v0';
export { confirm, useConfirm } from './composables/useConfirm';
export type { ConfirmRequest, UseConfirm } from './composables/useConfirm';
export { useToast } from './composables/useToast';
export type { EtsToast, ToastInput, ToastSeverity, UseToast } from './composables/useToast';

/* ── Composite controls ───────────────────────────────────────────────────
 * Built FROM the primitives above rather than from v0, and each owns a real
 * format — IPv4, duration, tags — with the parsing kept in a plain .ts beside
 * it so the awkward cases are testable without mounting anything.
 */
export { default as DateTimePicker } from './composite/DateTimePicker.vue';
export { boundDate, boundTime, joinDateTime, splitDateTime } from './composite/dateTime';
export type { DateTimeParts } from './composite/dateTime';

export { default as DateRangePicker } from './composite/DateRangePicker.vue';
export {
  emptyRange,
  isCompleteRange,
  isInvertedRange,
  normalizeRange,
  rangeContains,
  rangeProblem,
  rangesEqual,
} from './composite/dateRange';
export type { DateRange } from './composite/dateRange';

export { default as DateRangeSelector } from './composite/DateRangeSelector.vue';
export {
  DEFAULT_DATE_RANGE_PRESETS,
  addLocalDays,
  endOfLocalMonth,
  endOfLocalWeek,
  endOfLocalYear,
  formatDateRangeLabel,
  formatLocalYmd,
  lastNDaysRange,
  localToday,
  matchDateRangePreset,
  startOfLocalMonth,
  startOfLocalWeek,
  startOfLocalYear,
} from './composite/dateRangePresets';
export type { DateRangePreset, DateRangePresetContext } from './composite/dateRangePresets';

export { default as DurationInput } from './composite/DurationInput.vue';
export {
  DURATION_UNITS,
  describeDuration,
  durationError,
  formatDuration,
  isValidDuration,
  normalizeDuration,
  parseDuration,
} from './composite/duration';
export type { DurationUnit } from './composite/duration';

export { default as KeyValueEditor } from './composite/KeyValueEditor.vue';
export {
  duplicateKeyIndexes,
  emptyRow,
  keyError,
  newRowId,
  rowsError,
  sortRows,
  toRecord,
  toRows,
} from './composite/keyValue';
export type { KeyRules, KeyValueRow } from './composite/keyValue';

export { default as TagsInput } from './composite/TagsInput.vue';
export { addTags, containsTag, normalizeTag, removeTag, splitTags, tagError } from './composite/tags';
export type { AddTagsResult, TagRules } from './composite/tags';

export { default as Ipv4Editor } from './composite/Ipv4Editor.vue';
export { formatIpv4, fromInt, hasHostBits, parseIpv4, subnetOf, toInt } from './composite/ipv4';
export type { Ipv4Subnet, Ipv4Value } from './composite/ipv4';

export { default as ScheduleEditor } from './composite/ScheduleEditor.vue';
export {
  HOUR_INTERVALS,
  MONTH_INTERVALS,
  buildScheduleCron,
  defaultDraft,
  describeSchedule,
  detectRecurrence,
  draftToValue,
  formatScheduleDateTime,
  occurrencesBetween,
  scheduleNeverRuns,
  scheduleProblem,
  scheduleValuesEqual,
  toLocalDateTime,
  valueToDraft,
} from './composite/schedule';
export type {
  MonthlyStyle,
  NthWeek,
  RecurrenceFields,
  RecurrenceUnit,
  ScheduleDraft,
  ScheduleMode,
  ScheduleValue,
} from './composite/schedule';

export { default as DataTable } from './table/DataTable.vue';
export { default as Pagination } from './table/Pagination.vue';
export { DEFAULT_PAGE_SIZE_OPTIONS, parsePageSize } from './table/pageSize';

/* Three-dot density control for a CommandRail. Presentation of DataTable's
 * `density` model — pair with usePersistedTableDensity so the choice survives
 * a reload. */
export { default as TableDensityMenu } from './table/TableDensityMenu.vue';
export { usePersistedTableDensity } from './table/usePersistedTableDensity';
export type { PersistedTableDensityOptions } from './table/usePersistedTableDensity';

/* The persistence half of DataTable's `openGroups` model. Pass your app's
 * existing storagePrefix when adopting it, or saved expansion resets. */
export { usePersistedRowGroups } from './table/usePersistedRowGroups';
export type { PersistedRowGroups, PersistedRowGroupsOptions } from './table/usePersistedRowGroups';
export { scrollRowIntoView } from './table/scrollRowIntoView';
export type { DataTableColumn, DataTableDensity, DataTableSort } from './table/types';
export { DATA_TABLE_DENSITY_OPTIONS, isDataTableDensity } from './table/types';

export { bootstrapTheme, useTheme } from './composables/useTheme';
export type { ThemeOptions, ThemePreference, UseTheme } from './composables/useTheme';

/* The presentation half of useTheme — which glyph means "follow the OS" is a
 * design decision, and the icons come from this package's own subset. */
export { useThemeCycle } from './composables/useThemeCycle';
export type { ThemeCycleOption, UseThemeCycle } from './composables/useThemeCycle';

export { useFocusOrigin } from './composables/useFocusOrigin';
export type { UseFocusOrigin } from './composables/useFocusOrigin';

/* Session inactivity. The composable and IdleLogoutDialog are a pair — the
 * dialog's hint line documents the mousemove exclusion. */
export { useIdleTimeout } from './composables/useIdleTimeout';
export type { IdleTimeoutHandle, IdleTimeoutOptions } from './composables/useIdleTimeout';

/* Shared wall-clock ticker: one refcounted timer per app, boundary-aligned to
 * the coarsest granularity anyone needs — a lone `minute` subscriber wakes the
 * page once a minute. Refs hold the start of the current period. Drives
 * ScheduleEditor's occurrence list; also the HH:mm-clock-in-a-top-bar
 * composable. */
export { useClock } from './composables/useClock';
export type { ClockGranularity } from './composables/useClock';

/*
 * Focus and keyboard conventions. `focusField` knows that Input roots at a
 * wrapper rather than at the <input>, which is why it lives here and not in a
 * consuming app — see its header. `useFilterShortcut` and the `focusShortcut`
 * prop share one registry so Ctrl/Cmd+K (and `/`) cycle across opted-in fields.
 */
export { focusField } from './composables/focusField';
export { useFilterShortcut } from './composables/useFilterShortcut';
export { useDebouncedRef } from './composables/useDebouncedRef';

/* Timestamp presentation. Product voice, not a locale default — see the file. */
export { formatLocalDateTime, formatLocalDateTimeShort, relativeAge } from './format/dateTime';

export { AVAILABLE_ICONS, registerEtsIcons } from './icons';

/*
 * Skins `@ets/editor` for ETS apps (appearance + chrome). Pair with
 * `@ets/ui/styles/editor.css`. Optional: apps without editors skip both.
 */
export { createEtsEditorPlugin } from './editor/createEtsEditorPlugin';

/* ── Blade stack ──────────────────────────────────────────────────────────
 * Route-driven stacked detail panels. The URL is the stack: a nested route
 * joins it by wrapping its content in <Blade> and rendering <RouterView/>
 * INSIDE that blade's default slot.
 *
 * Requires @ets/ui/styles/blade.css, and every blade route to carry
 * `meta: { blade: true }`. Blade routes cannot use variable-length params
 * (:id+, :id*, catch-alls) — see paths.ts.
 */
export { default as Blade } from './blade/Blade.vue';
export { default as BladeAside } from './blade/BladeAside.vue';
export { default as BladeBackLink } from './blade/BladeBackLink.vue';
export { default as BladeErrorPanel } from './blade/BladeErrorPanel.vue';
export { default as BladeLink } from './blade/BladeLink.vue';
export { default as BladeStack } from './blade/BladeStack.vue';

export { bladeDepthKey, bladeStackKey } from './blade/context';
export type { BladeEntry, BladeStackInternals } from './blade/context';
export { ancestorOf, deepestClosableDepth, dirtyOffenders } from './blade/registry';
export { hasVariableLengthParams, isPathWithin, prefixPath, segmentCount } from './blade/paths';
export { BLADE_SIZES, BLADE_MIN_SIZES, BLADE_ASIDE_SIZES } from './blade/sizes';
export type { BladeSize, BladeMinSize, BladeAsideSize } from './blade/sizes';
export { useBladeStack } from './blade/useBladeStack';
export type { UseBladeStack } from './blade/useBladeStack';

export { blockerKey, installDirtyGuard } from './router/blocker';
export type { BlockerHandle } from './router/blocker';
export { installBladeRouter } from './router/installBladeRouter';
export { createNavigationState, idleNavigationState, navigationStateKey } from './router/navigationState';
export type { NavigationState } from './router/navigationState';
export { bladeScrollBehavior } from './router/scroll';

/* ── App layout (shell chrome) ────────────────────────────────────────────
 * Outer product frame: chrome='both' | 'topbar' | 'sidebar', collapsible rail,
 * optional #submenu above the main scrollport. Region slots hold brand / nav /
 * footer / tools — drop AppSidebarBrand into #brand; AppTopbar is start /
 * center / end (search often in #center); compose ThemeToggle / Avatar / Menu
 * into footer or topbar #end.
 *
 * Requires @ets/ui/styles/layout.css. Not a data-driven navItems API and
 * not a separate package — see ATS ADR-0013.
 */
export { default as AppLayout } from './layout/AppLayout.vue';
export { default as AppNavItem } from './layout/AppNavItem.vue';
export { default as AppSidebar } from './layout/AppSidebar.vue';
export { default as AppSidebarBrand } from './layout/AppSidebarBrand.vue';
export { default as AppTopbar } from './layout/AppTopbar.vue';
export { appLayoutKey } from './layout/context';
export type { AppLayoutChrome, AppLayoutContext } from './layout/context';
export { useAppLayout } from './layout/useAppLayout';
