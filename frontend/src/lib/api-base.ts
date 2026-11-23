import { Capacitor } from '@capacitor/core';

/**
 * The ONE place the API root is defined. Everything that calls the backend
 * builds its URL from here — never hardcode '/api' elsewhere.
 *
 * - Web (dev and production): always '/api' — relative, same origin; Vite proxies
 *   it in dev, CloudFront routes it in production. VITE_API_URL is deliberately
 *   ignored here: the production image build sets it to https://iluase.com/api
 *   (frontend/Dockerfile.production), and honouring it would turn every call from
 *   www.iluase.com into a cross-origin request.
 * - Capacitor app: must be absolute, because the app runs from capacitor://localhost
 *   (iOS) or https://localhost (Android). Build with VITE_API_URL=https://iluase.com/api
 *   (a shell env var overrides .env files).
 */
export function resolveApiBase(isNative: boolean, configured: string | undefined): string {
  const absolute = (configured || '').replace(/\/+$/, '');
  return isNative && absolute ? absolute : '/api';
}

export const API_BASE_URL: string = resolveApiBase(
  Capacitor.isNativePlatform(),
  import.meta.env.VITE_API_URL,
);

/** Absolute-or-relative URL for a backend path, e.g. apiUrl('/auth/refresh'). */
export function apiUrl(path: string): string {
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
