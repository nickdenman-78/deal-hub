// Configure Monaco's JSON language service to treat the jsonc dialect (single-line + block
// comments and trailing commas) as valid. By default Monaco's JSON parser accepts comments
// but its diagnostics layer still marks them as errors (`comments: 'error'` and
// `trailingCommas: 'error'`), which would flood every config file in our repo with red
// squiggles. The config is global — set it once via side effect when this module is first
// imported by any editor component in this package, which is always before that component
// calls monaco.editor.create.
//
// Other JSON syntax errors (mismatched braces, missing colons, illegal tokens) still get
// flagged normally; this just relaxes the two jsonc-specific diagnostics.

import * as monaco from 'monaco-editor';

const current = monaco.languages.json.jsonDefaults.diagnosticsOptions;
monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
  ...current,
  allowComments: true,
  comments: 'ignore',
  trailingCommas: 'ignore',
});
