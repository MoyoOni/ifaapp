import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { CartProvider } from '@/shared/contexts/cart-context';
import { ToastProvider } from '@/shared/components/toast';
import { GoogleOAuthProvider } from '@react-oauth/google';

// Create a fresh QueryClient for each test
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

interface WrapperProps {
  children: React.ReactNode;
}

/**
 * All-in-one wrapper that provides necessary providers for testing
 */
const AllTheProviders: React.FC<WrapperProps> = ({ children }) => {
  const queryClient = createTestQueryClient();

  return (
    <GoogleOAuthProvider clientId="test-client-id">
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ToastProvider>
            <CartProvider>{children}</CartProvider>
          </ToastProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
};

/**
 * Custom render function that wraps components with all providers
 */
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything from testing-library
export * from '@testing-library/react';

// Override render with our custom version
export { customRender as render };

// Export query client creator for tests that need direct access
export { createTestQueryClient };
