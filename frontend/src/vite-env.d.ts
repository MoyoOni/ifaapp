/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly MODE: string;
  readonly VITE_API_URL?: string;
  readonly VITE_SENTRY_DSN?: string;
  /** Enable demo data fallback when API fails (dev: true, production: false). PB-203.3 */
  readonly VITE_DEMO_MODE?: string;
  /** @deprecated Use VITE_DEMO_MODE */
  readonly VITE_ENABLE_DEMO_MODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
