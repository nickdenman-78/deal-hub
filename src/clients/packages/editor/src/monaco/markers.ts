/*
 * What a consumer needs in order to supply `JsonEditor`'s `scanMarkers`, so it
 * does not have to take a direct `monaco-editor` dependency for one enum.
 *
 * Marker severities are a runtime enum rather than a type, so a scanner cannot
 * be written against types alone — which meant the injection seam was
 * incomplete: `JsonEditor` accepted a function no caller could produce without
 * importing Monaco itself.
 *
 * A direct import in app source does work, and config-admin does exactly that
 * because its completion providers need the full API. It is simply a name the
 * optimizer then has to agree about across two module graphs — this package is
 * in `optimizeDeps.exclude`, so its own import resolves raw, while a bare
 * import in app source is prebundled into `.vite/deps`. Monaco's language
 * services are global registries and would not survive a genuine split, which
 * is why `monaco-editor` is a catalogued peer dependency. Routing through this
 * file just avoids raising the question at all.
 */

export { MarkerSeverity } from 'monaco-editor';
export type { editor } from 'monaco-editor';
