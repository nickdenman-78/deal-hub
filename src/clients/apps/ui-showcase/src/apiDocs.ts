export type PropDoc = {
  name: string;
  type: string;
  /** Omit when there is no default (required, or unset / falsey). */
  default?: string;
  notes?: string;
};

/** Shared field-chrome rows used by several form controls. */
const fieldChrome = (opts: { sizeDefault?: string; sizeType?: string } = {}): PropDoc[] => [
  { name: 'label', type: 'string' },
  { name: 'description', type: 'string', notes: 'Help text; wired to aria-describedby.' },
  {
    name: 'size',
    type: opts.sizeType ?? "'sm' | 'md' | 'lg'",
    default: opts.sizeDefault ?? "'md'",
  },
  { name: 'disabled', type: 'boolean' },
  {
    name: 'editable',
    type: 'boolean',
    notes: 'Deprecated — paints nothing. Read-only is the state that carries a treatment.',
  },
];

export const buttonProps: PropDoc[] = [
  {
    name: 'severity',
    type: "'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error'",
    default: "'secondary'",
    notes: 'Colour / intent. A screen of primaries has no primary.',
  },
  {
    name: 'variant',
    type: "'basic' | 'link' | 'text' | 'raised' | 'raisedText' | 'outlined'",
    default: "'basic'",
    notes: 'Visual treatment. basic is filled with the severity colour.',
  },
  { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'" },
  {
    name: 'weight',
    type: "'regular' | 'medium'",
    default: "'medium'",
    notes: 'Label weight. Pass `regular` for quiet chrome (command rails).',
  },
  { name: 'icon', type: 'string', notes: 'Leading Lucide name (unprefixed).' },
  { name: 'iconEnd', type: 'string', notes: 'Trailing Lucide name.' },
  { name: 'disabled', type: 'boolean' },
  {
    name: 'loading',
    type: 'boolean',
    notes:
      'Blocks activation; spinner after grace. Prefer `busy` — the spinner freezes under reduced motion (remote AVDs).',
  },
  {
    name: 'busy',
    type: 'boolean',
    notes:
      'Action running: disables, sets aria-busy, label and icon fade in and out. No spinner, no grace. Preferred for action buttons.',
  },
  { name: 'grace', type: 'number', default: '200', notes: 'ms before loading spinner shows.' },
  { name: 'block', type: 'boolean', notes: 'Full width.' },
  { name: 'ariaLabel', type: 'string', notes: 'Required for icon-only buttons.' },
  { name: 'as', type: 'string | object', notes: 'Render as `a` / RouterLink / etc.' },
  { name: 'default slot', type: 'VNode', notes: 'Button label.' },
];

export const themeToggleProps: PropDoc[] = [
  {
    name: 'labeled',
    type: 'boolean',
    notes: 'Show the preference label beside the icon. Default is icon-only.',
  },
  {
    name: 'showResolved',
    type: 'boolean',
    notes: 'When labeled and preference is System, append the live OS appearance — e.g. "System (dark)".',
  },
  {
    name: 'severity',
    type: "'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error'",
    default: "'secondary'",
  },
  {
    name: 'variant',
    type: "'basic' | 'link' | 'text' | 'raised' | 'raisedText' | 'outlined'",
    default: "'text'",
    notes: 'Text is the default — a theme control should not out-shout the page chrome.',
  },
  { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'" },
];

export const inputProps: PropDoc[] = [
  { name: 'v-model', type: 'string | undefined' },
  ...fieldChrome(),
  { name: 'type', type: 'string', default: "'text'" },
  { name: 'placeholder', type: 'string' },
  { name: 'readonly', type: 'boolean' },
  { name: 'required', type: 'boolean' },
  { name: 'icon', type: 'string', notes: 'Leading Lucide name.' },
  { name: 'clearable', type: 'boolean', notes: 'Clear button (pointer) + Escape while focused. Not a tab stop.' },
  {
    name: 'focusShortcut',
    type: 'boolean',
    notes: 'Join Ctrl/Cmd+K and `/` focus ring; cycles with other opted-in fields in document order.',
  },
  { name: 'rules', type: '((value: unknown) => true | string)[]' },
  { name: 'error', type: 'boolean', notes: 'Force error styling (e.g. server).' },
  { name: 'errorMessages', type: 'string | string[]' },
];

export const maskedInputProps: PropDoc[] = [
  {
    name: 'v-model',
    type: 'string | undefined',
    notes: 'Raw / sanitised value only — no grouping spaces or thousands separators.',
  },
  ...fieldChrome(),
  { name: 'type', type: 'string', default: "'text'" },
  { name: 'placeholder', type: 'string' },
  { name: 'readonly', type: 'boolean' },
  { name: 'required', type: 'boolean' },
  { name: 'icon', type: 'string', notes: 'Leading Lucide name.' },
  {
    name: 'mask',
    type: '(raw: string) => string',
    notes:
      'Sanitize into v-model on change. Use `normalizeIdName`, `unformatAuMobile`, `unformatAuLandline`, `unformatAuIntlPhone`, `unformatCreditCard` — not display formatters.',
  },
  {
    name: 'blurMask',
    type: '(raw: string) => string',
    notes:
      'Resting display only. Use `maskAuMobile`, `maskAuLandline`, `maskAuIntlPhone`, `maskCreditCard`, `formatCurrency`. Never written to v-model.',
  },
  {
    name: 'rules',
    type: '((value: unknown) => true | string)[]',
    notes: 'Same as Input. Pair with `idNameRule()` for id-name fields.',
  },
  { name: 'error', type: 'boolean', notes: 'Force error styling (e.g. server).' },
  { name: 'errorMessages', type: 'string | string[]' },
];

const maskedSpecialisation = (ruleNote: string): PropDoc[] => [
  {
    name: 'v-model',
    type: 'string | undefined',
    notes: 'Raw value (no grouping spaces). Display format applies when resting.',
  },
  ...fieldChrome(),
  { name: 'placeholder', type: 'string' },
  { name: 'readonly', type: 'boolean' },
  { name: 'required', type: 'boolean' },
  {
    name: 'rules',
    type: '((value: unknown) => true | string)[]',
    notes: ruleNote,
  },
  { name: 'error', type: 'boolean' },
  { name: 'errorMessages', type: 'string | string[]' },
];

export const abnAcnInputProps: PropDoc[] = [
  {
    name: 'v-model:kind',
    type: "'abn' | 'acn'",
    default: "'abn'",
    notes: 'Active identifier type. Drives resting display + checksum.',
  },
  {
    name: 'kindSelector',
    type: 'boolean',
    default: 'false',
    notes:
      'Show an ABN | ACN toggle at the end of the field. Paste of 9 or 11 digits (spaces optional) also selects the kind.',
  },
  ...maskedSpecialisation('Defaults to `abnRule()` or `acnRule()` from `kind`. Pass your own to replace.'),
];

export const creditCardInputProps: PropDoc[] = [
  ...maskedSpecialisation('Defaults to `creditCardRule()` (Luhn, 13–19 digits). Pass your own to replace.'),
  {
    name: 'masked',
    type: 'boolean',
    default: 'false',
    notes:
      'Resting display only — asterisks + last four (`**** **** **** 1111`). Full digits stay in `v-model`; focus reveals them.',
  },
  {
    name: 'autofill',
    type: 'boolean',
    default: 'true',
    notes:
      'When true, sets `autocomplete="cc-number"`. When false, turns autocomplete off and sets common password-manager ignore attributes.',
  },
];

export const nmiInputProps: PropDoc[] = maskedSpecialisation(
  'Defaults to `nmiRule()` (AEMO Luhn-10 checksum). Pass your own to replace.',
);

export const numberInputProps: PropDoc[] = [
  { name: 'v-model', type: 'string | undefined', notes: 'Raw amount only — no thousands separators (`1234.50`).' },
  ...fieldChrome(),
  { name: 'placeholder', type: 'string' },
  { name: 'readonly', type: 'boolean' },
  { name: 'required', type: 'boolean' },
  {
    name: 'prefixUnit',
    type: 'string',
    notes: 'Display-only before the value, e.g. `$`.',
  },
  {
    name: 'suffixUnit',
    type: 'string',
    notes: 'Display-only after the value, e.g. `certs` or `/MW`.',
  },
  {
    name: 'fractionDigits',
    type: 'number',
    default: '2',
    notes: 'Decimal places applied on blur.',
  },
  {
    name: 'locale',
    type: 'string',
    notes: 'Grouping / decimal separator via `toLocaleString`.',
  },
  { name: 'allowNegative', type: 'boolean', default: 'true' },
  { name: 'rules', type: '((value: unknown) => true | string)[]' },
  { name: 'error', type: 'boolean' },
  { name: 'errorMessages', type: 'string | string[]' },
];

export const textareaProps: PropDoc[] = [
  { name: 'v-model', type: 'string | undefined' },
  { name: 'label', type: 'string' },
  { name: 'description', type: 'string' },
  { name: 'placeholder', type: 'string' },
  { name: 'rows', type: 'number', default: '4' },
  { name: 'disabled', type: 'boolean' },
  { name: 'readonly', type: 'boolean' },
  { name: 'required', type: 'boolean' },
  { name: 'editable', type: 'boolean' },
  { name: 'mono', type: 'boolean', notes: 'Monospace face for JSON/config.' },
  { name: 'rules', type: '((value: unknown) => true | string)[]' },
  { name: 'error', type: 'boolean' },
  { name: 'errorMessages', type: 'string | string[]' },
];

export const dropzoneProps: PropDoc[] = [
  { name: 'accept', type: 'string', notes: 'Forwarded to the hidden input, e.g. `.csbak` or `image/*,.pdf`.' },
  {
    name: 'multiple',
    type: 'boolean',
    default: 'false',
    notes: 'Single mode emits only the first file of a multi-drop.',
  },
  { name: 'disabled', type: 'boolean', default: 'false', notes: 'Leaves the tab order and ignores drops.' },
  {
    name: 'label',
    type: 'string',
    default: "'Choose a file or drop one here'",
    notes: 'Accessible name for the zone.',
  },
  {
    name: 'hint',
    type: 'string',
    default: "'Drop a file here, or click to browse'",
    notes: 'Fallback hint when the default slot is not used.',
  },
  {
    name: '@select',
    type: '[files: File[]]',
    notes: 'The zone emits and holds nothing — what a chosen file looks like belongs to the caller.',
  },
  {
    name: 'default slot',
    type: '{ over }',
    notes: 'Renders the caller-owned chosen state. The zone stays a drop target, so a second drop replaces the pick.',
  },
];

export const monthPickerProps: PropDoc[] = [
  { name: 'v-model', type: 'string | undefined', notes: 'ISO `yyyy-MM`. Never a Date.' },
  { name: 'label', type: 'string' },
  { name: 'description', type: 'string' },
  { name: 'min', type: 'string', notes: 'Earliest selectable month, `yyyy-MM`.' },
  { name: 'max', type: 'string', notes: 'Latest selectable month, `yyyy-MM`.' },
  { name: 'disabled', type: 'boolean' },
  { name: 'readonly', type: 'boolean', notes: 'Shows the month as a value; the grid is not rendered.' },
  { name: 'clearable', type: 'boolean' },
  { name: 'size', type: "'sm' | 'md' | 'lg'", notes: "Default 'md'." },
  { name: 'placeholder', type: 'string', notes: "Default 'Select month…'." },
  { name: 'locale', type: 'string', notes: 'Month NAMES only. The value is never localised.' },
  { name: 'ariaLabel', type: 'string', notes: 'Accessible name when there is no visible label.' },
];

export const checkboxProps: PropDoc[] = [
  { name: 'v-model', type: 'boolean | undefined' },
  { name: 'label', type: 'string' },
  { name: 'description', type: 'string' },
  { name: 'disabled', type: 'boolean' },
  {
    name: 'readonly',
    type: 'boolean',
    notes: 'Reports the state without offering to change it. Not disabled: undimmed, still a tab stop.',
  },
  { name: 'indeterminate', type: 'boolean', notes: 'Mixed state; distinct from checked.' },
];

export const switchProps: PropDoc[] = [
  { name: 'v-model', type: 'boolean | undefined' },
  { name: 'label', type: 'string' },
  { name: 'disabled', type: 'boolean' },
];

export const selectOptionProps: PropDoc[] = [
  { name: 'value', type: 'TValue', notes: 'Required. `string | number`.' },
  { name: 'label', type: 'string', notes: 'Required.' },
  { name: 'disabled', type: 'boolean' },
];

export const selectProps: PropDoc[] = [
  { name: 'v-model', type: 'TValue | undefined' },
  { name: 'options', type: 'SelectOption<TValue>[]', notes: 'Required.' },
  { name: 'label', type: 'string' },
  { name: 'description', type: 'string' },
  { name: 'placeholder', type: 'string', default: "'Select…'" },
  { name: 'disabled', type: 'boolean' },
  { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'" },
  { name: 'readonly', type: 'boolean', notes: 'Shows the selection as a value; the listbox is not rendered.' },
  {
    name: 'editable',
    type: 'boolean',
    notes: 'Deprecated — paints nothing. Read-only is the state that carries a treatment.',
  },
  {
    name: 'clearable',
    type: 'boolean',
    notes: 'Clear button (pointer) + Escape while focused (menu closed). Not a tab stop.',
  },
  {
    name: 'focusShortcut',
    type: 'boolean',
    notes: 'Join Ctrl/Cmd+K and `/` focus ring; cycles with other opted-in fields in document order.',
  },
  { name: '#option', type: '{ option }', notes: 'Custom option rendering.' },
];

export const multiSelectProps: PropDoc[] = [
  { name: 'v-model', type: 'TValue[]', default: '[]' },
  { name: 'options', type: 'SelectOption<TValue>[]', notes: 'Required.' },
  { name: 'label', type: 'string' },
  { name: 'description', type: 'string' },
  { name: 'placeholder', type: 'string', default: "'Select…'" },
  { name: 'disabled', type: 'boolean' },
  { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'" },
  { name: 'readonly', type: 'boolean', notes: 'Chips stay readable; the menu and clear control are not rendered.' },
  {
    name: 'editable',
    type: 'boolean',
    notes: 'Deprecated — paints nothing. Read-only is the state that carries a treatment.',
  },
  { name: 'maxChips', type: 'number', default: '3', notes: 'Then collapses to “+N more”.' },
  {
    name: 'clear (built-in)',
    type: '—',
    notes: 'Shown when anything is selected. Pointer + Escape (menu closed). Not a tab stop.',
  },
  {
    name: 'focusShortcut',
    type: 'boolean',
    notes: 'Join Ctrl/Cmd+K and `/` focus ring; cycles with other opted-in fields in document order.',
  },
];

export const comboboxProps: PropDoc[] = [
  { name: 'v-model', type: 'string | undefined' },
  { name: 'options', type: 'string[]', notes: 'Required. Plain suggestions.' },
  { name: 'label', type: 'string' },
  { name: 'description', type: 'string' },
  { name: 'placeholder', type: 'string' },
  { name: 'disabled', type: 'boolean' },
  { name: 'strict', type: 'boolean', notes: 'Reject values not in options.' },
  { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'" },
  { name: 'readonly', type: 'boolean', notes: 'Shows the value as text; the menu is not rendered.' },
  {
    name: 'editable',
    type: 'boolean',
    notes: 'Deprecated — paints nothing. Read-only is the state that carries a treatment.',
  },
];

export const toggleGroupProps: PropDoc[] = [
  { name: 'v-model', type: 'TValue | TValue[] | undefined' },
  { name: 'options', type: 'ToggleOption<TValue>[]', notes: 'Required.' },
  { name: 'label', type: 'string', notes: 'Required. Accessible name for the group.' },
  { name: 'multiple', type: 'boolean' },
  { name: 'mandatory', type: 'boolean', notes: 'Cannot clear the last selection.' },
  { name: 'disabled', type: 'boolean' },
  { name: 'size', type: "'sm' | 'md'", default: "'md'" },
];

export const radioOptionProps: PropDoc[] = [
  { name: 'value', type: 'TValue', notes: 'Required. `string | number`.' },
  { name: 'label', type: 'string', notes: 'Required.' },
  { name: 'description', type: 'string', notes: 'Secondary line under the label.' },
  { name: 'disabled', type: 'boolean' },
];

export const radioGroupProps: PropDoc[] = [
  { name: 'v-model', type: 'TValue | undefined', notes: 'Changeable, never clearable — radio semantics.' },
  { name: 'options', type: 'RadioOption<TValue>[]', notes: 'Required.' },
  { name: 'label', type: 'string', notes: 'Required. Accessible name for the group.' },
  { name: 'orientation', type: "'vertical' | 'horizontal'", default: "'vertical'" },
  { name: 'disabled', type: 'boolean' },
  { name: 'size', type: "'sm' | 'md'", default: "'md'" },
];

export const toggleOptionProps: PropDoc[] = [
  { name: 'value', type: 'TValue', notes: 'Required.' },
  { name: 'label', type: 'string' },
  { name: 'icon', type: 'string' },
  { name: 'disabled', type: 'boolean' },
  { name: 'ariaLabel', type: 'string', notes: 'Required when icon-only.' },
];

export const datePickerProps: PropDoc[] = [
  { name: 'v-model', type: 'string | undefined', notes: 'ISO `yyyy-mm-dd`.' },
  { name: 'label', type: 'string' },
  { name: 'description', type: 'string' },
  { name: 'min', type: 'string', notes: 'ISO `yyyy-mm-dd`.' },
  { name: 'max', type: 'string', notes: 'ISO `yyyy-mm-dd`.' },
  {
    name: 'disabledWeekdays',
    type: 'readonly Weekday[]',
    notes: '`Date#getDay` 0–6. Use `WEEKEND_DAYS` for Sat/Sun. Rejected after selection.',
  },
  {
    name: 'disabledDates',
    type: 'readonly string[]',
    notes: 'ISO `yyyy-mm-dd` holidays / closures. Rejected after selection.',
  },
  { name: 'disabled', type: 'boolean' },
  { name: 'required', type: 'boolean' },
  { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'" },
  { name: 'readonly', type: 'boolean', notes: 'Value stays readable; the calendar never opens.' },
  {
    name: 'editable',
    type: 'boolean',
    notes: 'Deprecated — paints nothing. Read-only is the state that carries a treatment.',
  },
];

export const timePickerProps: PropDoc[] = [
  { name: 'v-model', type: 'string | undefined', notes: '`HH:mm` or `HH:mm:ss`.' },
  { name: 'label', type: 'string' },
  { name: 'description', type: 'string' },
  { name: 'min', type: 'string', notes: '`HH:mm` / `HH:mm:ss`.' },
  { name: 'max', type: 'string', notes: '`HH:mm` / `HH:mm:ss`.' },
  {
    name: 'step',
    type: 'number | string',
    notes: 'Seconds. Under 60 exposes a seconds part (e.g. `1`).',
  },
  { name: 'disabled', type: 'boolean' },
  { name: 'required', type: 'boolean' },
  { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'" },
  { name: 'readonly', type: 'boolean', notes: 'Value stays readable; the clock never opens.' },
  {
    name: 'editable',
    type: 'boolean',
    notes: 'Deprecated — paints nothing. Read-only is the state that carries a treatment.',
  },
];

export const dateTimePickerProps: PropDoc[] = [
  {
    name: 'v-model',
    type: 'string | undefined',
    notes: '`yyyy-mm-ddTHH:mm` (datetime-local shape, no timezone).',
  },
  { name: 'label', type: 'string' },
  { name: 'description', type: 'string' },
  { name: 'min', type: 'string', notes: 'Full datetime; time bound applies on that day only.' },
  { name: 'max', type: 'string', notes: 'Full datetime; time bound applies on that day only.' },
  {
    name: 'step',
    type: 'number | string',
    notes: 'Forwarded to TimePicker — under 60 exposes seconds.',
  },
  {
    name: 'disabledWeekdays',
    type: 'readonly Weekday[]',
    notes: 'Forwarded to DatePicker. `WEEKEND_DAYS` for Sat/Sun.',
  },
  {
    name: 'disabledDates',
    type: 'readonly string[]',
    notes: 'Forwarded to DatePicker. ISO holiday / closure dates.',
  },
  { name: 'disabled', type: 'boolean' },
  { name: 'required', type: 'boolean' },
  { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'" },
  { name: 'readonly', type: 'boolean', notes: 'Forwarded to the date and time pickers beneath.' },
  {
    name: 'editable',
    type: 'boolean',
    notes: 'Deprecated — paints nothing. Read-only is the state that carries a treatment.',
  },
];

export const dateRangePickerProps: PropDoc[] = [
  {
    name: 'v-model',
    type: 'DateRange',
    default: '{}',
    notes:
      '`{ from?, to? }`, ISO `yyyy-mm-dd`. An object, not a tuple — `range.from` survives a refactor better than `range[0]`. Half-open ranges are legitimate filters, not errors.',
  },
  { name: 'label', type: 'string' },
  { name: 'description', type: 'string' },
  { name: 'min', type: 'string', notes: 'ISO outer lower bound for both ends.' },
  { name: 'max', type: 'string', notes: 'ISO outer upper bound for both ends.' },
  { name: 'fromLabel', type: 'string', default: "'From'", notes: 'Accessible name for the start picker.' },
  { name: 'toLabel', type: 'string', default: "'To'", notes: 'Accessible name for the end picker.' },
  { name: 'disabled', type: 'boolean' },
  { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'" },
  { name: 'readonly', type: 'boolean', notes: 'Forwarded to the two date pickers beneath.' },
  {
    name: 'editable',
    type: 'boolean',
    notes: 'Deprecated — paints nothing. Read-only is the state that carries a treatment.',
  },
];

export const dateRangeSelectorProps: PropDoc[] = [
  {
    name: 'v-model',
    type: 'DateRange',
    default: '{}',
    notes: 'Same `{ from?, to? }` ISO model as DateRangePicker. Presets snapshot into this range on select.',
  },
  {
    name: 'presets',
    type: 'readonly DateRangePreset[]',
    default: 'DEFAULT_DATE_RANGE_PRESETS',
    notes: '`{ id, label, resolve(ctx) }`. Override or pass `[]` to offer Custom only.',
  },
  { name: 'label', type: 'string' },
  { name: 'description', type: 'string' },
  { name: 'placeholder', type: 'string', default: "'Select range…'" },
  { name: 'min', type: 'string', notes: 'ISO outer lower bound for the Custom panel.' },
  { name: 'max', type: 'string', notes: 'ISO outer upper bound for the Custom panel.' },
  { name: 'disabled', type: 'boolean' },
  { name: 'clearable', type: 'boolean' },
  { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'" },
  { name: 'readonly', type: 'boolean', notes: 'Shows the resolved range; the trigger and panel are not rendered.' },
  {
    name: 'editable',
    type: 'boolean',
    notes: 'Deprecated — paints nothing. Read-only is the state that carries a treatment.',
  },
  { name: 'focusShortcut', type: 'boolean', notes: 'Registers for Ctrl/Cmd+K and `/`.' },
];

export const dateRangePresetProps: PropDoc[] = [
  { name: 'id', type: 'string', notes: 'Stable key used for matching and listbox option ids.' },
  { name: 'label', type: 'string', notes: 'Shown in the list and on the collapsed control when matched.' },
  {
    name: 'resolve',
    type: '(ctx: DateRangePresetContext) => DateRange',
    notes:
      '`ctx.today` is local yyyy-mm-dd. Return inclusive `{ from, to }` ISO dates — use addLocalDays / lastNDaysRange helpers; never Date#toISOString().',
  },
];

export const messageProps: PropDoc[] = [
  { name: 'severity', type: "'info' | 'success' | 'warning' | 'error'", default: "'info'" },
  { name: 'title', type: 'string', notes: 'Optional bold first line.' },
  { name: 'icon', type: 'string', notes: 'Overrides severity glyph.' },
  { name: 'closable', type: 'boolean' },
  { name: '@close', type: '() => void' },
  { name: 'default slot', type: 'VNode', notes: 'Body copy.' },
];

export const emptyStateProps: PropDoc[] = [
  { name: 'icon', type: 'string', notes: 'Lucide name from the offline subset. Omit for text-only.' },
  { name: 'title', type: 'string', notes: 'Required.' },
  { name: 'description', type: 'string', notes: 'Room to say why the surface is empty.' },
  {
    name: '#actions',
    type: 'slot',
    notes: 'The action that fills the surface. No built-in button — label and handler are always the caller’s.',
  },
  { name: 'default slot', type: 'VNode', notes: 'Extra content between description and actions.' },
];

export const tagProps: PropDoc[] = [
  {
    name: 'severity',
    type: "'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error'",
    default: "'secondary'",
  },
  { name: 'variant', type: "'soft' | 'solid' | 'outline'", default: "'soft'" },
  { name: 'icon', type: 'string' },
  { name: 'default slot', type: 'VNode', notes: 'Chip label.' },
];

export const badgeProps: PropDoc[] = [
  {
    name: 'content',
    type: 'string | number | null',
    notes: 'Count or short label. `0` / empty hides the mark unless `dot`.',
  },
  {
    name: 'max',
    type: 'number',
    notes: 'Numeric cap — `content={120}` with `max={99}` shows `99+`.',
  },
  {
    name: 'severity',
    type: "'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error'",
    default: "'error'",
  },
  {
    name: 'dot',
    type: 'boolean',
    notes: 'Small filled dot with no label (still shows when content is empty).',
  },
  {
    name: 'position',
    type: "'top-end' | 'top-start' | 'bottom-end' | 'bottom-start'",
    default: "'top-end'",
    notes: 'Corner when wrapping a host.',
  },
  { name: 'label', type: 'string', notes: 'Accessible name for the mark.' },
  { name: 'default slot', type: 'VNode', notes: 'Optional host control to overlay.' },
];

export const spinnerProps: PropDoc[] = [
  { name: 'size', type: 'number', default: '24' },
  { name: 'label', type: 'string', default: "'Loading'", notes: 'Accessible status name.' },
  { name: 'centered', type: 'boolean', notes: 'Centre in available space.' },
];

export const gradientDividerProps: PropDoc[] = [
  {
    name: 'orientation',
    type: "'horizontal' | 'vertical'",
    default: "'vertical'",
  },
  {
    name: 'thickness',
    type: 'number | string',
    default: '2',
    notes: 'Thin axis. Number = px; other CSS lengths pass through.',
  },
  {
    name: 'length',
    type: 'number | string',
    notes: "Long axis. Number = px. `'auto'` fills the parent. Default: 60 (vertical) or auto/full-width (horizontal).",
  },
];

export const skeletonProps: PropDoc[] = [
  {
    name: 'variant',
    type: "'title' | 'subtitle' | 'line' | 'block' | 'circle'",
    default: "'line'",
    notes:
      'title/subtitle sit inside heading wrappers, line is a body row, block fills whatever box the caller gives it, circle stands in for an Avatar.',
  },
  {
    name: 'width',
    type: 'string',
    notes:
      'CSS length; overrides the variant default. Vary line widths so a block reads as ragged prose, not a barcode.',
  },
  { name: 'height', type: 'string', notes: 'CSS length; overrides the variant default.' },
];

export const progressBarProps: PropDoc[] = [
  { name: 'value', type: 'number', notes: 'Required.' },
  { name: 'min', type: 'number', default: '0' },
  { name: 'max', type: 'number', default: '100' },
  { name: 'label', type: 'string', default: "'Progress'", notes: 'aria-label.' },
  { name: 'showValue', type: 'boolean', notes: 'Show percent beside the bar.' },
  {
    name: 'severity',
    type: "'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error'",
    default: "'primary'",
  },
];

export const cardProps: PropDoc[] = [
  { name: 'title', type: 'string' },
  { name: 'subtitle', type: 'string' },
  { name: 'flush', type: 'boolean', notes: 'No body padding (e.g. nested table).' },
  { name: '#header / #actions / #footer', type: 'slot', notes: 'Chrome regions.' },
  { name: 'default slot', type: 'VNode', notes: 'Body.' },
];

export const pageHeaderProps: PropDoc[] = [
  { name: 'title', type: 'string', notes: 'Required (or replace via `#title`).' },
  { name: 'subtitle', type: 'string', notes: 'Secondary line under the title row.' },
  {
    name: 'subtitleMono',
    type: 'boolean',
    default: 'false',
    notes: 'Monospace subtitle — for identifiers (a path, a slug, a key) rather than prose.',
  },
  {
    name: 'as',
    type: "'h1' | 'h2' | 'h3'",
    default: "'h1'",
    notes: 'Heading element. Pass h2 inside a page that already has an h1 so the outline stays honest.',
  },
  { name: '#title', type: 'slot', notes: 'Replaces the title text.' },
  { name: '#meta', type: 'slot', notes: 'Inline metadata (tags, badges) hugging the title.' },
  { name: '#actions', type: 'slot', notes: 'Trailing action cluster, pushed to the end of the row.' },
  { name: 'default slot', type: 'VNode', notes: 'Extra content under the subtitle.' },
];

export const commandRailProps: PropDoc[] = [
  {
    name: 'ariaLabel',
    type: 'string',
    notes: 'Accessible name for the toolbar landmark.',
  },
  {
    name: 'showLabels',
    type: 'boolean',
    default: 'false',
    notes:
      'Show field labels beside controls. Off by default — labels stay in the tree for a11y and are mirrored onto each control as a native `title` tooltip.',
  },
  {
    name: 'default slot',
    type: 'VNode',
    notes: 'One or more `CommandRailGroup` children.',
  },
];

export const commandRailGroupProps: PropDoc[] = [
  { name: 'ariaLabel', type: 'string', notes: 'Accessible name for this cluster.' },
  {
    name: 'end',
    type: 'boolean',
    default: 'false',
    notes: 'Push the group to the trailing edge of the rail.',
  },
  {
    name: 'default slot',
    type: 'VNode',
    notes: 'Buttons, inputs, selects — typically size sm; labeled fields lay out inline.',
  },
];

export const dialogProps: PropDoc[] = [
  { name: 'v-model:open', type: 'boolean', notes: 'Required.' },
  { name: 'title', type: 'string', notes: 'Required (or `#title`).' },
  { name: 'description', type: 'string' },
  { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'" },
  { name: 'width', type: 'string', notes: 'CSS width; prefer size.' },
  { name: 'closable', type: 'boolean', default: 'true' },
  { name: 'closeOnEscape', type: 'boolean', default: 'true' },
  { name: 'closeOnClickOutside', type: 'boolean', default: 'false' },
  { name: '#title / #footer / default', type: 'slot' },
];

export const confirmProps: PropDoc[] = [
  { name: 'confirm(options)', type: '(ConfirmRequest) => Promise<boolean>', notes: 'Imperative API.' },
  { name: 'title', type: 'string', notes: 'Required on ConfirmRequest.' },
  { name: 'message', type: 'string', notes: 'Required on ConfirmRequest.' },
  { name: 'confirmLabel', type: 'string' },
  { name: 'cancelLabel', type: 'string' },
  { name: 'destructive', type: 'boolean', notes: 'Danger styling on confirm.' },
];

export const drawerProps: PropDoc[] = [
  { name: 'v-model:open', type: 'boolean', notes: 'Required.' },
  { name: 'title', type: 'string', notes: 'Required (or `#title`).' },
  { name: 'side', type: "'start' | 'end'", default: "'end'" },
  { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'" },
  { name: 'width', type: 'string', notes: 'CSS width; prefer size.' },
  { name: 'modeless', type: 'boolean', notes: 'No scrim; clicks pass through.' },
  { name: 'closable', type: 'boolean', default: 'true' },
  { name: 'closeOnEscape', type: 'boolean', default: 'true' },
  { name: 'closeOnScrimClick', type: 'boolean', default: 'true' },
  { name: '#title / default', type: 'slot' },
];

export const menuItemProps: PropDoc[] = [
  { name: 'label', type: 'string' },
  { name: 'icon', type: 'string' },
  { name: 'action', type: '() => void' },
  { name: 'disabled', type: 'boolean' },
  { name: 'destructive', type: 'boolean' },
  { name: 'separator', type: 'boolean', notes: 'Divider; omit action.' },
];

export const menuProps: PropDoc[] = [
  { name: 'items', type: 'MenuItem[]', notes: 'Required.' },
  { name: 'positionArea', type: 'string', notes: 'CSS position-area placement.' },
  {
    name: 'positionTry',
    type: 'string',
    default: 'flip-block, flip-inline, flip-block flip-inline',
    notes: 'CSS position-try-fallbacks — flips when the preferred placement overflows.',
  },
  { name: 'triggerLabel', type: 'string', notes: 'Accessible name on the activator.' },
  { name: 'triggerClass', type: 'string' },
  { name: 'default slot', type: 'VNode', notes: 'Non-interactive trigger content.' },
];

export const megaMenuProps: PropDoc[] = [
  { name: 'model', type: 'MegaMenuEntry[]', notes: 'Required. One menubar entry each.' },
  {
    name: 'orientation',
    type: "'horizontal' | 'vertical'",
    default: 'horizontal',
    notes: 'Swaps which arrows walk the bar and which opens a panel.',
  },
  { name: 'label', type: 'string', notes: 'Accessible name for the menubar.' },
  {
    name: 'flow',
    type: "'auto' | 'column' | 'list'",
    default: 'auto',
    notes:
      'What up/down do at a column boundary. auto decides per entry: labelled columns wrap within the column, bare ones run on into the next.',
  },
  {
    name: 'positionArea',
    type: 'string',
    default: 'bottom span-right / right span-bottom',
    notes: 'CSS position-area placement of the panels; the default follows orientation.',
  },
  {
    name: 'positionTry',
    type: 'string',
    default: 'flip-block, flip-inline, flip-block flip-inline',
    notes: 'CSS position-try-fallbacks — flips when the preferred placement overflows.',
  },
  {
    name: 'hoverSwitch',
    type: 'boolean',
    default: 'true',
    notes: 'Hover moves between panels once one is open. It never opens the first.',
  },
  { name: '@select', type: '(item: MegaMenuItem | MegaMenuEntry) => void', notes: 'Fires after the panel closes.' },
];

export const megaMenuEntryProps: PropDoc[] = [
  { name: 'label', type: 'string', notes: 'Required.' },
  { name: 'icon', type: 'string' },
  { name: 'columns', type: 'MegaMenuGroup[][]', notes: 'Panel contents; outer array is columns. Omit for a command.' },
  { name: 'to', type: 'RouteLocationRaw', notes: 'Renders a RouterLink. Only for entries with no columns.' },
  { name: 'href', type: 'string' },
  { name: 'action', type: '() => void' },
  { name: 'disabled', type: 'boolean' },
  { name: 'active', type: 'boolean', notes: 'Caller-owned — the library never guesses the current route.' },
];

export const megaMenuGroupProps: PropDoc[] = [
  { name: 'label', type: 'string', notes: 'Omit for an unlabelled run.' },
  { name: 'items', type: 'MegaMenuItem[]', notes: 'Required.' },
];

export const megaMenuItemProps: PropDoc[] = [
  { name: 'label', type: 'string' },
  { name: 'icon', type: 'string' },
  { name: 'to', type: 'RouteLocationRaw', notes: 'Renders a RouterLink.' },
  { name: 'href', type: 'string' },
  { name: 'action', type: '() => void' },
  { name: 'disabled', type: 'boolean' },
  { name: 'active', type: 'boolean' },
  { name: 'separator', type: 'boolean', notes: 'Divider; omit label.' },
];

export const contextMenuProps: PropDoc[] = [
  { name: 'items', type: 'MenuItem[]', notes: 'Required. Same shape as Menu.' },
  { name: 'disabled', type: 'boolean', default: 'false' },
  { name: 'default slot', type: 'VNode', notes: 'Right-click / context-key target.' },
];

export const popoverProps: PropDoc[] = [
  { name: 'v-model:open', type: 'boolean', default: 'false' },
  { name: 'positionArea', type: 'string' },
  {
    name: 'positionTry',
    type: 'string',
    default: 'flip-block, flip-inline, flip-block flip-inline',
    notes: 'CSS position-try-fallbacks — flips when the preferred placement overflows.',
  },
  { name: 'label', type: 'string', notes: 'Accessible name for the panel and activator.' },
  {
    name: 'contentClass',
    type: 'string',
    notes: 'Extra class on the panel — e.g. to widen past the default 28rem max-width.',
  },
  { name: 'tabbable', type: 'boolean', default: 'true', notes: 'When false, activator gets tabindex="-1".' },
  { name: 'disabled', type: 'boolean' },
  { name: '#activator / default', type: 'slot' },
];

export const tooltipProps: PropDoc[] = [
  { name: 'text', type: 'string', notes: 'Required.' },
  { name: 'openDelay', type: 'number', default: '400', notes: 'ms.' },
  { name: 'disabled', type: 'boolean' },
  { name: 'positionArea', type: 'string' },
  { name: 'default slot', type: 'VNode', notes: 'Hover/focus target.' },
];

export const toastProps: PropDoc[] = [
  { name: 'useToast()', type: 'UseToast', notes: 'Requires `<ToastHost />` in the shell.' },
  { name: 'severity', type: "'info' | 'success' | 'warning' | 'error'", default: "'info'" },
  { name: 'summary', type: 'string', notes: 'Required headline.' },
  { name: 'detail', type: 'string' },
  { name: 'life', type: 'number', notes: 'ms; omit for severity default. Errors never auto-dismiss.' },
  { name: 'success / info / warn / error', type: '(input) => void', notes: 'Helpers on UseToast.' },
];

export const dataTableProps: PropDoc[] = [
  { name: 'rows', type: 'readonly T[]', notes: 'Required.' },
  { name: 'columns', type: 'DataTableColumn<T>[]', notes: 'Required.' },
  { name: 'rowId', type: '(row: T) => string | number', notes: 'Required. Stable identity.' },
  { name: 'loading', type: 'boolean', default: 'false' },
  { name: 'emptyText', type: 'string', default: "'Nothing to show.'" },
  { name: 'ariaLabel', type: 'string' },
  { name: 'groupBy', type: 'keyof T & string', notes: 'Construction-time only; not reactive.' },
  { name: 'openGroupsInitially', type: 'boolean' },
  { name: 'striped', type: 'boolean' },
  { name: 'density', type: "'compact' | 'standard' | 'comfortable'", default: "'standard'" },
  { name: 'rowHref', type: '(row: T) => string | undefined', notes: 'Activatable rows + new-tab.' },
  { name: 'rowActive', type: '(row: T) => boolean' },
  { name: 'rowClass', type: '(row: T) => string | undefined' },
  { name: 'v-model:search', type: 'string', default: "''" },
  { name: 'v-model:openGroups', type: 'string[] | undefined', notes: 'Omit for uncontrolled.' },
  {
    name: 'selectable',
    type: 'boolean',
    default: 'false',
    notes:
      'Leading checkbox column + select-all header. Selection is kept in the table so ids of filtered-out rows survive a filter — a bulk action must not silently shrink because the operator narrowed the view after ticking.',
  },
  {
    name: 'v-model:selected',
    type: 'Array<string | number>',
    default: '[]',
    notes: 'Selected row ids (`selectable` only).',
  },
  {
    name: 'expandable',
    type: 'boolean',
    default: 'false',
    notes: 'Per-row disclosure: a leading chevron column toggles a full-width row rendered from `#expanded`.',
  },
  {
    name: 'v-model:expanded',
    type: 'Array<string | number>',
    default: '[]',
    notes: 'Expanded row ids (`expandable` only) — persist or close them programmatically.',
  },
  { name: '@rowActivate', type: '[row: T]' },
  {
    name: 'showFilterLabels',
    type: 'boolean',
    default: 'false',
    notes:
      'Show visible labels on `.r-field` controls in `#filters`. Default omits them (keep `label` for a11y). Checkbox labels always show.',
  },
  {
    name: '#filters',
    type: 'slot',
    notes:
      'Sticky free-form filter bar above headers — not column-aligned. Any form controls. Caller owns values and filtering. Field labels omitted by default.',
  },
  { name: '#expanded', type: '{ row }', notes: 'Full-width disclosure row under an expanded row (`expandable` only).' },
  { name: '#cell-{id} / #group-header / #empty', type: 'slot' },
];

export const dataTableColumnProps: PropDoc[] = [
  { name: 'id', type: 'string', notes: 'Required. Sort/filter/slot key.' },
  { name: 'header', type: 'string', notes: 'Omit for actions columns.' },
  { name: 'field', type: 'keyof T & string', notes: 'Omit for derived `#cell-*` columns.' },
  { name: 'sortable', type: 'boolean' },
  { name: 'filterable', type: 'boolean', notes: 'Included in free-text search — not the `#filters` slot.' },
  { name: 'align', type: "'start' | 'center' | 'end'" },
  { name: 'width', type: 'string', notes: 'CSS width via colgroup.' },
  { name: 'sort', type: '(a, b) => number', notes: 'Custom comparator.' },
];

export const tableDensityMenuProps: PropDoc[] = [
  {
    name: 'v-model',
    type: "'compact' | 'standard' | 'comfortable'",
    default: "'standard'",
    notes: 'Bind to `DataTable`’s `density`. Pair with `usePersistedTableDensity` to remember the choice.',
  },
  {
    name: 'triggerLabel',
    type: 'string',
    default: "'Row density'",
    notes: 'Accessible name and native tooltip on the ⋮ activator.',
  },
  { name: 'positionArea', type: 'string', default: "'bottom span-left'", notes: 'CSS position-area placement.' },
];

export const paginationProps: PropDoc[] = [
  { name: 'page', type: 'number', notes: 'Required. Zero-based.' },
  { name: 'pageSize', type: 'number', notes: 'Required.' },
  { name: 'total', type: 'number', notes: 'Required. Server-reported total rows.' },
  {
    name: 'pageSizeOptions',
    type: 'readonly number[]',
    default: 'DEFAULT_PAGE_SIZE_OPTIONS',
    notes: '`[10, 15, 20, 25, 30, 40, 50, 100]`. Pass `[]` with `allowCustomPageSize: false` to hide Rows.',
  },
  {
    name: 'allowCustomPageSize',
    type: 'boolean',
    default: 'true',
    notes: 'Adds Custom… so the operator can type any integer ≥ 1.',
  },
  { name: 'disabled', type: 'boolean', default: 'false' },
  { name: 'v-model:page / update:page', type: 'number' },
  { name: 'v-model:pageSize / update:pageSize', type: 'number', notes: 'Resets page to 0.' },
];

export const treeProps: PropDoc[] = [
  { name: 'v-model', type: 'string | string[] | undefined', notes: 'Selected id(s).' },
  { name: 'items', type: 'TreeItem[]', notes: 'Required.' },
  { name: 'label', type: 'string', notes: 'Required. Accessible name.' },
  { name: 'multiple', type: 'boolean' },
  {
    name: 'selectable',
    type: "'all' | 'leaf'",
    default: "'all'",
    notes:
      'Restrict which nodes take a selection. In multiple mode, `leaf` maps to cascade-to-leaves (parent click selects leaf descendants; parents stay out of v-model). Expand/collapse is always the chevron.',
  },
  {
    name: 'selectMode',
    type: "'select' | 'toggle'",
    notes:
      'Row click on an already-selected node: leave it (`select`) or clear it (`toggle`). Omitting follows `multiple` (toggle when multi, select when single). Ignored when `checkboxes` is on — a checkbox always toggles.',
  },
  {
    name: 'checkboxes',
    type: 'boolean',
    notes:
      'Draw a checkbox beside each node icon. Always toggles selection on click. In multiple mode parents are tristate (none / some / all descendants). Decorative — selection stays on aria-selected.',
  },
  { name: 'openMode', type: "'single' | 'multiple'", default: "'multiple'" },
  { name: 'openAll', type: 'boolean' },
  {
    name: 'v-model:open',
    type: 'string[]',
    notes:
      'Open branch ids. Leave unbound to keep expansion internal. Pair with `usePersistedTreeExpansion` to remember expansion per operator.',
  },
  {
    name: 'usePersistedTreeExpansion(key, { storagePrefix })',
    type: '{ expanded, reconcile }',
    notes:
      'The persistence half of `v-model:open` — bind `expanded`, call `reconcile` with the current branch ids when data changes. Pass the storagePrefix your app already writes under, or saved expansion resets.',
  },
  { name: '#node', type: '{ item }', notes: 'Custom node content.' },
];

export const treeItemProps: PropDoc[] = [
  { name: 'id', type: 'string', notes: 'Required.' },
  { name: 'label', type: 'string', notes: 'Required.' },
  { name: 'icon', type: 'string' },
  { name: 'disabled', type: 'boolean' },
  { name: 'children', type: 'TreeItem[]' },
];

export const accordionProps: PropDoc[] = [
  {
    name: 'v-model',
    type: 'string | number | Array | undefined',
    notes: 'Open panel value(s). Becomes an array when multiple is on.',
  },
  { name: 'orientation', type: "'horizontal' | 'vertical'", default: "'vertical'" },
  {
    name: 'variant',
    type: "'default' | 'plain'",
    default: "'default'",
    notes: 'plain drops the outer border and header fill for nested list pages.',
  },
  { name: 'multiple', type: 'boolean', notes: 'Allow more than one panel open.' },
  {
    name: 'mandatory',
    type: "boolean | 'force'",
    notes: 'true keeps one open; force auto-opens the first enabled panel.',
  },
  { name: 'disabled', type: 'boolean' },
  { name: 'default slot', type: 'AccordionItem+', notes: 'Panels.' },
];

export const accordionItemProps: PropDoc[] = [
  { name: 'value', type: 'string | number', notes: 'Required. Matches Accordion v-model.' },
  { name: 'disabled', type: 'boolean' },
  { name: 'header slot', type: 'VNode', notes: 'Trigger label.' },
  { name: 'default slot', type: 'VNode', notes: 'Panel body.' },
];

export const tabsProps: PropDoc[] = [
  { name: 'v-model', type: 'string | number | undefined' },
  { name: 'orientation', type: "'horizontal' | 'vertical'", default: "'horizontal'" },
  { name: 'activation', type: "'automatic' | 'manual'", default: "'manual'" },
  { name: 'mandatory', type: 'boolean', default: 'true' },
  { name: 'circular', type: 'boolean', default: 'true', notes: 'Arrow keys wrap.' },
];

export const tabListProps: PropDoc[] = [
  { name: 'label', type: 'string', notes: 'Required. Accessible name for the tablist.' },
];

export const tabProps: PropDoc[] = [
  { name: 'value', type: 'string | number', notes: 'Required. Matches TabPanel.' },
  { name: 'disabled', type: 'boolean' },
  { name: 'icon', type: 'string' },
  { name: 'default slot', type: 'VNode', notes: 'Tab label.' },
];

export const tabPanelProps: PropDoc[] = [
  { name: 'value', type: 'string | number', notes: 'Required. Matches Tab.' },
  { name: 'default slot', type: 'VNode' },
];

export const stepperProps: PropDoc[] = [
  { name: 'v-model', type: 'TValue | undefined', notes: 'The current step. Unset shows the first step.' },
  { name: 'steps', type: 'StepperStep<TValue>[]', notes: 'Required. The strip has to name steps not yet reached.' },
  { name: 'label', type: 'string', notes: 'Required. Accessible name for the strip.' },
  {
    name: 'linear',
    type: 'boolean',
    default: 'true',
    notes: 'Markers walk backwards only; forward is the flow’s own gate. false makes every step clickable.',
  },
  { name: 'orientation', type: "'horizontal' | 'vertical'", default: "'horizontal'" },
  {
    name: 'default slot',
    type: 'VNode',
    notes: 'The StepperPanels. Scoped: index, step, isFirst, isLast, next, prev, goTo.',
  },
  { name: '#actions', type: 'VNode', notes: 'Footer bar. Same scope as the default slot.' },
];

export const stepperPanelProps: PropDoc[] = [
  { name: 'value', type: 'string', notes: 'Required. Matches a step’s value.' },
  { name: 'default slot', type: 'VNode', notes: 'Rendered only while this step is current.' },
];

export const stepperStepProps: PropDoc[] = [
  { name: 'value', type: 'TValue', notes: 'Required. What v-model carries.' },
  { name: 'label', type: 'string', notes: 'Required.' },
  { name: 'description', type: 'string', notes: 'Second line under the label.' },
  { name: 'icon', type: 'string', notes: 'Marker glyph before completion; a completed step always shows the tick.' },
  { name: 'disabled', type: 'boolean', notes: 'Skipped by next/prev, never clickable.' },
  {
    name: 'status',
    type: "'complete' | 'current' | 'upcoming' | 'success' | 'warning' | 'error'",
    notes: 'Outcome override for a step the flow finished badly. Absent means derive it from position.',
  },
];

export const editorTabsProps: PropDoc[] = [
  { name: 'v-model', type: 'string | undefined', notes: 'The active tab id.' },
  {
    name: 'tabs',
    type: 'EditorTab[]',
    notes: 'Required. The strip renders nothing when empty — the empty state belongs to the caller.',
  },
  {
    name: 'closable',
    type: 'boolean',
    default: 'true',
    notes: 'Also gates the right-click close menu and drag-to-reorder: a fixed strip owns its tab order and lifecycle.',
  },
  { name: 'icon', type: 'string', default: "'file'", notes: 'Strip-level tab icon.' },
  {
    name: 'mono',
    type: 'boolean',
    default: 'false',
    notes: 'Monospace labels — file names and other exact identifiers.',
  },
  {
    name: '@close / @close-others / @close-right',
    type: '[id: string]',
    notes: 'The caller owns the tab list; the strip only asks.',
  },
  { name: '@close-all', type: '[]' },
  {
    name: '@reorder',
    type: '[orderedIds: string[]]',
    notes: 'Full new order after a drop; no-op drops are skipped.',
  },
];

export const editorTabProps: PropDoc[] = [
  { name: 'id', type: 'string', notes: 'Required. Stable identity — the active model and events use it.' },
  { name: 'label', type: 'string', notes: 'Required.' },
  { name: 'title', type: 'string', notes: 'Tooltip; defaults to the label. Use for the full path behind a basename.' },
  { name: 'dirty', type: 'boolean', notes: 'Unsaved-changes dot.' },
  { name: 'icon', type: 'string', notes: 'Per-tab icon; overrides the strip-level `icon`.' },
];

export const breadcrumbsProps: PropDoc[] = [{ name: 'items', type: 'Crumb[]', notes: 'Required.' }];

export const crumbProps: PropDoc[] = [
  { name: 'label', type: 'string', notes: 'Required.' },
  { name: 'to', type: 'RouteLocationRaw', notes: 'Omit on the current page crumb.' },
  { name: 'title', type: 'string', notes: 'Native tooltip (e.g. canonical id).' },
];

export const avatarProps: PropDoc[] = [
  { name: 'name', type: 'string', notes: 'Required. Initials + accessible name.' },
  { name: 'src', type: 'string' },
  { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'" },
];

export const timelineProps: PropDoc[] = [
  { name: 'items', type: 'TimelineItem[]', notes: 'Required. The caller owns the order — newest first by convention.' },
  {
    name: 'selectable',
    type: 'boolean',
    default: 'false',
    notes: 'Entries render as buttons (version pickers); without it they are plain list items (read-only feeds).',
  },
  {
    name: 'mono',
    type: 'boolean',
    default: 'false',
    notes: 'Monospace titles — timestamps and identifiers, not prose.',
  },
  { name: 'label', type: 'string', default: "'Activity'", notes: 'Accessible name for the feed.' },
  { name: 'v-model', type: 'string | null', default: 'null', notes: 'Selected entry id (selectable lists only).' },
  { name: '@select', type: '[id: string]' },
  {
    name: '#item',
    type: '{ item }',
    notes: 'Replaces the title/meta/trailing trio for feeds needing more per-entry structure.',
  },
  {
    name: '#item-end',
    type: '{ item }',
    notes: 'Per-entry extras outside the button — a “here” tag, a per-row action — so they stay clickable-separate.',
  },
];

export const timelineItemProps: PropDoc[] = [
  { name: 'id', type: 'string', notes: 'Required.' },
  { name: 'title', type: 'string', notes: 'Required. Primary line — the event.' },
  { name: 'meta', type: 'string', notes: 'Secondary line, start-aligned — usually when (a relative age).' },
  { name: 'trailing', type: 'string', notes: 'Secondary line, end-aligned — usually who.' },
  { name: 'icon', type: 'string', notes: 'Marker icon; omit for a plain dot.' },
  { name: 'tooltip', type: 'string', notes: 'Defaults to the title.' },
];

export const splitterProps: PropDoc[] = [
  { name: 'orientation', type: "'horizontal' | 'vertical'", default: "'horizontal'" },
  { name: 'disabled', type: 'boolean' },
  { name: 'default slot', type: 'SplitterPanel+', notes: 'Panels; sizes should sum to 100.' },
];

export const splitterPanelProps: PropDoc[] = [
  { name: 'defaultSize', type: 'number', notes: 'Percent. Required in practice (0% if omitted).' },
  { name: 'minSize', type: 'number' },
  { name: 'maxSize', type: 'number' },
  { name: 'collapsible', type: 'boolean' },
  { name: 'collapsedSize', type: 'number' },
  { name: 'handle', type: 'boolean', notes: 'Resize handle before this panel.' },
  { name: 'handleLabel', type: 'string', default: "'Resize'" },
];

export const iconProps: PropDoc[] = [
  { name: 'name', type: 'string', notes: 'Required. Lucide name without `lucide:`.' },
  { name: 'size', type: 'number | string', default: '16' },
  { name: 'label', type: 'string', notes: 'Omit when decorative beside text.' },
];

export const cronEditorProps: PropDoc[] = [
  { name: 'v-model', type: 'string | undefined', notes: 'Five-field cron, or six with a leading seconds field.' },
  { name: 'label', type: 'string' },
  { name: 'description', type: 'string' },
  { name: 'disabled', type: 'boolean' },
  {
    name: 'readonly',
    type: 'boolean',
    notes: 'Prose-only face; no parts editor.',
  },
  { name: 'required', type: 'boolean' },
  {
    name: 'editable',
    type: 'boolean',
    notes: 'Deprecated — paints nothing. Read-only is the state that carries a treatment.',
  },
  { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'" },
  {
    name: 'showOccurrences',
    type: 'boolean',
    default: 'true',
    notes:
      'Info control on the right with the next five fire times (disabled while invalid). Non-tabbable; Alt+Down opens it from a focused field when valid.',
  },
];

export const ipv4EditorProps: PropDoc[] = [
  { name: 'v-model', type: 'string | undefined' },
  { name: 'label', type: 'string' },
  { name: 'description', type: 'string' },
  { name: 'format', type: "'address' | 'cidr' | 'either'", default: "'either'" },
  { name: 'disabled', type: 'boolean' },
  {
    name: 'readonly',
    type: 'boolean',
    notes: 'Blocks editing; takes the muted read-only treatment. Info / copy still work.',
  },
  { name: 'required', type: 'boolean' },
  { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'" },
  {
    name: 'editable',
    type: 'boolean',
    notes: 'Deprecated — paints nothing. Read-only is the state that carries a treatment.',
  },
  { name: 'showSubnet', type: 'boolean', notes: 'Inline network / broadcast / usable range.' },
  {
    name: 'showSubnetInfo',
    type: 'boolean',
    notes:
      'Info icon + popover. CIDR values include subnet details; every format shows the model string with a copy control. Disabled while invalid. Alt+Down opens it from any focused box when valid.',
  },
];

export const durationInputProps: PropDoc[] = [
  { name: 'v-model', type: 'string | undefined', notes: 'e.g. `30s`, `2h30m`.' },
  { name: 'label', type: 'string' },
  { name: 'description', type: 'string' },
  { name: 'placeholder', type: 'string', default: "'30s'" },
  { name: 'disabled', type: 'boolean' },
  { name: 'required', type: 'boolean' },
  { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'" },
  { name: 'readonly', type: 'boolean', notes: 'Refuses typing; the presets withdraw.' },
  {
    name: 'editable',
    type: 'boolean',
    notes: 'Deprecated — paints nothing. Read-only is the state that carries a treatment.',
  },
  { name: 'min', type: 'number', notes: 'Milliseconds lower bound.' },
  { name: 'max', type: 'number', notes: 'Milliseconds upper bound.' },
  { name: 'units', type: 'DurationUnit[]', notes: "`'ms' | 's' | 'm' | 'h' | 'd'`." },
  { name: 'normalize', type: 'boolean', notes: 'Canonicalise on blur (off by default).' },
  { name: 'presets', type: 'string[]', notes: 'Quick-set buttons.' },
];

export const keyValueEditorProps: PropDoc[] = [
  { name: 'v-model', type: 'Record<string, string>', default: '{}' },
  { name: 'label', type: 'string' },
  { name: 'description', type: 'string' },
  { name: 'disabled', type: 'boolean' },
  { name: 'readonly', type: 'boolean', notes: 'Cells refuse edits; Sort, Add and the Remove column withdraw.' },
  {
    name: 'editable',
    type: 'boolean',
    notes: 'Deprecated — paints nothing. Read-only is the state that carries a treatment.',
  },
  { name: 'keyLabel', type: 'string', default: "'Key'" },
  { name: 'valueLabel', type: 'string', default: "'Value'" },
  { name: 'keyPlaceholder', type: 'string', default: "'key'" },
  { name: 'valuePlaceholder', type: 'string', default: "'value'" },
  {
    name: 'rules',
    type: 'KeyRules',
    notes: 'Optional key format: `pattern`, `patternMessage`, `maxKeyLength`, `caseInsensitive`.',
  },
  { name: 'sortable', type: 'boolean', notes: 'Offers manual sort by key.' },
  { name: 'addLabel', type: 'string', default: "'Add entry'" },
];

export const scheduleEditorProps: PropDoc[] = [
  {
    name: 'v-model',
    type: 'ScheduleValue | undefined',
    notes:
      '`{ start?, cron?, end? }`. Now/Later emit `start` alone; recurring adds a five-field `cron` and an optional inclusive `end` date. `undefined` until a choice is made.',
  },
  ...fieldChrome(),
  { name: 'readonly', type: 'boolean', notes: 'Prose summary only — for review screens.' },
  { name: 'required', type: 'boolean' },
  {
    name: 'showOccurrences',
    type: 'boolean',
    default: 'true',
    notes: 'Info icon beside the summary opening a next-runs popover.',
  },
  { name: 'min', type: 'string', notes: 'Earliest selectable start, `yyyy-mm-ddTHH:mm`.' },
];

export const useClockApi: PropDoc[] = [
  {
    name: 'useClock(granularity)',
    type: '(granularity: ClockGranularity) => Readonly<ShallowRef<Date>>',
    notes:
      'Call during component setup. The ref holds the START of the current period (start of minute, local midnight, …) and is written exactly once per boundary crossing. The subscription is released on unmount; with no subscribers left, the shared timer stops entirely.',
  },
  {
    name: 'ClockGranularity',
    type: "'second' | 'minute' | 'hour' | 'day'",
    notes: 'The shared timer runs at the finest subscribed granularity — a minute-only page wakes once a minute.',
  },
];

export const tagsInputProps: PropDoc[] = [
  { name: 'v-model', type: 'string[]', default: '[]' },
  { name: 'label', type: 'string' },
  { name: 'description', type: 'string' },
  { name: 'placeholder', type: 'string', default: "'Type and press Enter'" },
  { name: 'disabled', type: 'boolean' },
  { name: 'required', type: 'boolean' },
  { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'" },
  { name: 'readonly', type: 'boolean', notes: 'Chips stay; the draft input, remove buttons and suggestions withdraw.' },
  {
    name: 'editable',
    type: 'boolean',
    notes: 'Deprecated — paints nothing. Read-only is the state that carries a treatment.',
  },
  { name: 'maxTags', type: 'number' },
  { name: 'rules', type: 'TagRules' },
  { name: 'suggestions', type: 'string[]', notes: 'One-click adds under the field.' },
];

export const bladeProps: PropDoc[] = [
  { name: 'title', type: 'string', notes: 'Required. Plain string (crumb / discard dialog).' },
  { name: 'subtitle', type: 'string' },
  { name: 'size', type: "'sm' | 'md' | 'lg' | 'xl' | 'fill'", default: "'md'" },
  {
    name: 'minSize',
    type: "'sm' | 'md' | 'lg' | 'xl'",
    notes: "Width floor for a `fill` blade (built-in floor is 'lg'). Ignored on mobile.",
  },
  { name: 'closable', type: 'boolean', default: 'true' },
  { name: 'closeTo', type: 'RouteLocationRaw', notes: 'Override parent path on close.' },
  { name: 'dirty', type: 'boolean', notes: 'Confirm before leaving.' },
  { name: '#actions / #footer / #subtitle / #titleEnd / default', type: 'slot' },
];

export const bladeLinkProps: PropDoc[] = [
  { name: 'to', type: 'RouteLocationRaw', notes: 'Required.' },
  { name: 'exact', type: 'boolean', default: 'false' },
  { name: 'default slot', type: 'VNode', notes: 'Row label.' },
];

export const jsonEditorProps: PropDoc[] = [
  { name: 'modelValue', type: 'string', notes: 'Required. Active model contents.' },
  { name: 'uri', type: 'string', notes: 'Optional model cache key (preserves undo).' },
  { name: 'readOnly', type: 'boolean' },
  { name: 'language', type: 'string', default: "'json'" },
  { name: 'autoHeight', type: 'boolean' },
  { name: 'isDark', type: 'boolean | null', default: 'null', notes: '`null` follows host theme.' },
  { name: 'scanMarkers', type: '(model) => IMarkerData[]', notes: 'Injected diagnostics.' },
  { name: 'markerOwner', type: 'string', default: "'ets.editor'" },
  { name: 'markerDebounceMs', type: 'number', default: '200' },
  { name: 'update:modelValue', type: 'string' },
];

export const diffViewerProps: PropDoc[] = [
  { name: 'original', type: 'string', notes: 'Required.' },
  { name: 'modified', type: 'string', notes: 'Required.' },
  { name: 'language', type: 'string' },
  { name: 'isDark', type: 'boolean | null', default: 'null' },
];

export const mergeEditorProps: PropDoc[] = [
  { name: 'base', type: 'string', notes: 'Required.' },
  { name: 'theirs', type: 'string', notes: 'Required.' },
  { name: 'mine', type: 'string', notes: 'Required.' },
  { name: 'language', type: 'string' },
  { name: 'isDark', type: 'boolean | null', default: 'null' },
];

export const markdownEditorProps: PropDoc[] = [
  { name: 'modelValue', type: 'string', notes: 'Required.' },
  { name: 'readOnly', type: 'boolean' },
  { name: 'minHeight', type: 'string' },
  { name: 'isDark', type: 'boolean | null', default: 'null' },
  { name: 'update:modelValue', type: 'string' },
];

export const markdownViewProps: PropDoc[] = [
  { name: 'source', type: 'string | null' },
  { name: 'maxHeight', type: 'string', notes: 'Caps and scrolls inside when set.' },
];

export const markdownExcerptProps: PropDoc[] = [
  { name: 'source', type: 'string | null' },
  { name: 'maxChars', type: 'number', default: '120' },
];

export const simpleMarkdownEditorProps: PropDoc[] = [
  { name: 'v-model', type: 'string | undefined' },
  { name: 'label', type: 'string' },
  { name: 'description', type: 'string' },
  { name: 'placeholder', type: 'string' },
  { name: 'disabled', type: 'boolean' },
  { name: 'readonly', type: 'boolean' },
  { name: 'features', type: 'Partial<MarkdownFeatures>' },
  { name: 'toolbar', type: 'boolean | MarkdownTool[]', default: 'true' },
  { name: 'menu', type: "'toolbar' | 'inline'", default: "'toolbar'" },
  { name: 'minHeight', type: 'string', default: "'9rem'" },
  { name: 'maxHeight', type: 'string' },
  { name: 'maxLength', type: 'number', notes: 'Counted on plain text.' },
  { name: 'showCount', type: 'boolean', default: 'false' },
  { name: 'editable', type: 'boolean' },
  { name: 'pastePlainText', type: 'boolean' },
];

export const appLayoutProps: PropDoc[] = [
  {
    name: 'chrome',
    type: "'both' | 'topbar' | 'sidebar'",
    default: "'both'",
    notes: 'Topbar + sidebar, topbar only, or sidebar only.',
  },
  {
    name: 'v-model:collapsed',
    type: 'boolean',
    default: 'false',
    notes: 'Expanded ↔ icons-only rail (ignored when chrome is topbar).',
  },
  { name: 'navTitle', type: 'string', default: "'Navigate'", notes: 'Accessible name for the narrow Drawer.' },
  {
    name: '#sidebar / #topbar / #submenu / default',
    type: 'slot',
    notes: '#submenu is optional context/secondary nav above the main scrollport. Main slot scrolls.',
  },
];

export const appSidebarSlots: PropDoc[] = [
  { name: '#brand', type: 'slot', notes: 'Logo — typically AppSidebarBrand.' },
  { name: '#nav', type: 'slot', notes: 'Primary nav — typically AppNavItem rows.' },
  {
    name: '#footer',
    type: 'slot',
    notes: 'Theme / profile / settings. Collapse control is always present on desktop.',
  },
];

export const appSidebarBrandProps: PropDoc[] = [
  { name: 'label', type: 'string', default: "'ETS'", notes: 'Accessible name (aria-label).' },
  { name: 'to', type: 'RouteLocationRaw', notes: 'Renders as RouterLink.' },
  { name: 'href', type: 'string', notes: 'Renders as <a>.' },
];

export const appTopbarSlots: PropDoc[] = [
  { name: '#start', type: 'slot', notes: 'Title, breadcrumbs; narrow menu control is prepended automatically.' },
  { name: '#center', type: 'slot', notes: 'Optional. Optically centred (e.g. global search).' },
  { name: '#end', type: 'slot', notes: 'Tools, theme, profile — alternate home for chrome.' },
];

export const appNavItemProps: PropDoc[] = [
  { name: 'icon', type: 'string', notes: 'Required. Lucide name without prefix.' },
  { name: 'label', type: 'string', notes: 'Required. Visible when expanded; tooltip + aria-label in rail mode.' },
  { name: 'to', type: 'RouteLocationRaw', notes: 'Renders as RouterLink.' },
  { name: 'href', type: 'string', notes: 'Renders as <a>.' },
  { name: 'exact', type: 'boolean', default: 'false' },
  { name: 'active', type: 'boolean', default: 'false', notes: 'Force active style for button / href rows.' },
  { name: 'default slot', type: 'VNode', notes: 'Optional label override.' },
];

export const definitionListProps: PropDoc[] = [
  {
    name: 'items',
    type: 'DefinitionItem[]',
    notes: 'Required. `{ key, label, value, mono?, wide? }`. A null, undefined or empty value renders a dash.',
  },
  { name: 'columns', type: '1 | 2', default: '2', notes: '`wide` items span both columns.' },
];

export const columnPickerProps: PropDoc[] = [
  { name: 'v-model', type: 'string[]', notes: 'Required. Ids of the visible columns.' },
  { name: 'allColumns', type: 'DataTableColumn<T>[]', notes: 'Required. Every column the table can show.' },
  { name: 'requiredIds', type: 'string[]', notes: 'Columns that stay visible; their checkboxes cannot be cleared.' },
];

export const confirmDialogProps: PropDoc[] = [
  { name: 'open', type: 'boolean', notes: 'Required.' },
  { name: 'title', type: 'string', notes: 'Required.' },
  { name: 'confirmLabel', type: 'string', default: "'Confirm'" },
  { name: 'cancelLabel', type: 'string', default: "'Cancel'" },
  { name: 'destructive', type: 'boolean', default: 'false', notes: 'Paints the confirm button as an error action.' },
  { name: '@confirm / @cancel', type: '() => void', notes: 'The caller closes the dialog by clearing `open`.' },
];

export const idleLogoutDialogProps: PropDoc[] = [
  { name: 'open', type: 'boolean', notes: 'Required. Usually `warningActive` from useIdleTimeout().' },
  { name: 'seconds', type: 'number', notes: 'Required. Seconds left before sign-out.' },
  { name: 'warningSeconds', type: 'number', notes: 'Required. Length of the warning window; drives the progress bar.' },
  { name: '@stay', type: '() => void', notes: 'The operator chose to stay signed in.' },
];
