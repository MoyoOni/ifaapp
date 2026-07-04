/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly MODE: string;
  readonly VITE_API_URL?: string;
  readonly VITE_SENTRY_DSN?: string;
  /**
   * Enable demo-data fallback when an API call fails (P2-02). Every read of
   * this flag is additionally wrapped in `import.meta.env.DEV`, so it has no
   * effect in a production build regardless of what a stray .env sets here.
   */
  readonly VITE_DEMO_MODE?: string;
  readonly VITE_ENABLE_DEMO_MODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
