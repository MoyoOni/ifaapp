import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CartProvider } from './shared/contexts/cart-context';
import { LanguageProvider } from './shared/contexts/language-context';
import { ToastProvider } from './shared/components/toast';
import { ModalProvider } from './components/common/ModalProvider';
import { ThemeProvider } from './shared/contexts/theme-provider';
import { DevRoleSwitcher } from './shared/components/dev-role-switcher';
import { initSentry } from './shared/config/sentry';
import { logger } from './shared/utils/logger';
import App from './App';
import './index.css';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

// ── Production environment guard ─────────────────────────────────────────────
// Fail fast if VITE_API_URL is missing or still pointing at localhost in a
// production build. This prevents a silent "everything loads but all API calls
// fail" failure mode that is very hard to diagnose after deployment.
if (import.meta.env.PROD) {
  const apiUrl = import.meta.env.VITE_API_URL as string | undefined;
  const isMisconfigured = !apiUrl || apiUrl.includes('localhost') || apiUrl.includes('127.0.0.1');

  if (isMisconfigured) {
    const root = document.getElementById('root');
    if (root) {
      root.innerHTML = `
        <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#fafaf9;font-family:Arial,sans-serif;padding:24px;">
          <div style="max-width:480px;text-align:center;background:#fff;border:1px solid #e7e5e4;border-radius:24px;padding:48px 32px;">
            <div style="font-size:48px;margin-bottom:16px;">⚙️</div>
            <h1 style="color:#1c1917;font-size:22px;font-weight:700;margin:0 0 12px;">Configuration Error</h1>
            <p style="color:#57534e;font-size:15px;line-height:1.6;margin:0 0 24px;">
              <code style="background:#f5f5f4;padding:2px 6px;border-radius:4px;">VITE_API_URL</code>
              is not configured correctly for this production build.
            </p>
            <p style="color:#78716c;font-size:13px;margin:0;">
              Set <code style="background:#f5f5f4;padding:2px 6px;border-radius:4px;">VITE_API_URL</code>
              to your production API address (e.g. <code>https://app.ilu-ase.com/api</code>)
              and rebuild the frontend.
            </p>
          </div>
        </div>`;
    }
    // Stop execution — do not mount the React app
    throw new Error(`[V4-907] VITE_API_URL is misconfigured in production: "${apiUrl}"`);
  }
}
// ─────────────────────────────────────────────────────────────────────────────

// Unregister any stale service workers so old cached assets don't break the app
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => registration.unregister());
  });
  // Also clear all caches left by old service worker
  if ('caches' in window) {
    caches.keys().then((keys) => keys.forEach((key) => caches.delete(key)));
  }
}

// Production: All errors propagate to Sentry
logger.info('Production Mode: API errors will propagate to Sentry for monitoring');

initSentry();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      // Don't retry auth errors (401/403) — they won't resolve without user action
      retry: (failureCount, error: any) => {
        const status = error?.response?.status;
        if (status === 401 || status === 403 || status === 404) return false;
        return failureCount < 1;
      },
      // Don't throw errors to ErrorBoundary — let components handle them
      throwOnError: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
            <CartProvider>
              <ToastProvider>
                <ModalProvider>
                  <App />
                  <DevRoleSwitcher />
                </ModalProvider>
              </ToastProvider>
            </CartProvider>
          </ThemeProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>
);