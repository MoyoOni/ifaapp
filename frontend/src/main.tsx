import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CartProvider } from './shared/contexts/cart-context';
import { LanguageProvider } from './shared/contexts/language-context';
import { ToastProvider } from './shared/components/toast';
import { ThemeProvider } from './shared/contexts/theme-provider';
import { DevRoleSwitcher } from './shared/components/dev-role-switcher';
import { initSentry } from './shared/config/sentry';
import { logger } from './shared/utils/logger';
import App from './App';
import './index.css';

// Production: All errors propagate to Sentry
logger.info('Production Mode: API errors will propagate to Sentry for monitoring');

initSentry();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
          <CartProvider>
            <ToastProvider>
              <App />
              <DevRoleSwitcher />
            </ToastProvider>
          </CartProvider>
        </ThemeProvider>
      </LanguageProvider>
    </QueryClientProvider>
  </React.StrictMode>
);