import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CartProvider } from './shared/contexts/cart-context';
import { LanguageProvider } from './shared/contexts/language-context';
import { ToastProvider } from './shared/components/toast';
import { ThemeProvider } from './shared/contexts/theme-provider';
import { DevRoleSwitcher } from './shared/components/dev-role-switcher';
import { initSentry } from './shared/config/sentry';
import { isDemoMode } from './shared/config/demo-mode';
import App from './App';
import './index.css';

// Log demo mode status (HC-203.3)
if (isDemoMode) {
  console.warn('🎭 Demo Mode: ENABLED - API failures will use demo data');
} else {
  console.log('✅ Demo Mode: DISABLED - API errors will propagate to Sentry');
}

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
