/**
 * Intent / colour role shared by Button, Tag, Badge, ProgressBar, Message, and
 * Toast. Components may subset this union (Message and Toast use StatusSeverity).
 *
 * A later custom severity is one member here plus one `.r-severity-*` block in
 * `styles/severity.css` that sets the five `--sev-*` custom properties.
 */
export type Severity = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error';

/** Status-only subset — banners, toasts, and other "something happened" chrome. */
export type StatusSeverity = Extract<Severity, 'info' | 'success' | 'warning' | 'error'>;
