/**
 * The ONE place the API root is defined. Everything that calls the backend
 * builds its URL from here — never hardcode '/api' elsewhere.
 *
 * - Web (dev and production): '/api' — relative, same origin; Vite proxies it in dev.
 * - Capacitor app: must be absolute, because the app runs from https://localhost.
 *   Build with VITE_API_URL=https://iluase.com/api (a shell env var overrides .env files).
 */
export const API_BASE_URL: string = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '');

/** Absolute-or-relative URL for a backend path, e.g. apiUrl('/auth/refresh'). */
export function apiUrl(path: string): string {
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
