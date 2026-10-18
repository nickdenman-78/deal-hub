/// <reference types="vite/client" />

// No `declare module '*.vue'` shim: vue-tsc resolves SFCs and infers their real
// props, which a shim would flatten to `any`.

interface ImportMetaEnv {
  readonly VITE_OIDC_AUTHORITY?: string;
  readonly VITE_OIDC_CLIENT_ID?: string;
  readonly VITE_OIDC_SCOPE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
