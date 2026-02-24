/**
 * Demo mode flag (PB-203.3).
 * When true, API failures fall back to demo data.
 * When false (production), API failures should propagate (Sentry captures).
 */
export const isDemoMode =
  import.meta.env.VITE_DEMO_MODE === 'true' ||
  import.meta.env.VITE_ENABLE_DEMO_MODE === 'true';
