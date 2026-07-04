/**
 * Demo/quick-access mode is a permanent dev-and-QA-only feature (P2-02):
 * devLogin() fabricates a client-side-only session for internal demos and
 * local development, keyed off a `dev_mode_role` localStorage value.
 *
 * `import.meta.env.DEV` is statically replaced at build time, so wrapping
 * every read in it means production bundles never evaluate — and Rollup
 * tree-shakes away — this branch at all. That guarantees a `dev_mode_role`
 * value can never take effect in a production deployment, regardless of how
 * it ended up in a user's localStorage (devLogin() itself already refuses to
 * write it under NODE_ENV=production, but reads should not have to trust that
 * every call site remembers to check separately).
 */
export function isDevModeActive(): boolean {
  return import.meta.env.DEV && !!localStorage.getItem('dev_mode_role');
}
