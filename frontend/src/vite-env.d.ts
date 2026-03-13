/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly MODE: string;
  readonly VITE_API_URL?: string;
  readonly VITE_SENTRY_DSN?: string;
  /** Enable demo data fallback when API fails (dev: true, production: false). PB-203.3 */
  // Demo mode disabled in production - kept for reference only
  // readonly VITE_DEMO_MODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
