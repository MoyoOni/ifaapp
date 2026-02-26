import * as Sentry from '@sentry/react';
import { Integrations } from '@sentry/tracing';
import { BrowserTracing } from '@sentry/browser';

// Initialize Sentry for error monitoring
export const initSentry = () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('Sentry is disabled in development mode');
    return;
  }

  Sentry.init({
    dsn: process.env.VITE_SENTRY_DSN || '',
    integrations: [
      new BrowserTracing({
        // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
        tracePropagationTargets: [
          /^https:\/\/your-website\.com/,
          /^https:\/\/api\.your-website\.com/,
          // Add your production URLs here
        ],
      }),
    ],
    // Performance Monitoring
    tracesSampleRate: 0.5, // Capture 50% of transactions for performance monitoring
    
    // Session Replay - uncomment if you want to use this feature
    /*
    replaysSessionSampleRate: 0.1, // This sets the sample rate at 10% for session replay
    replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
    integrations: [
      new Sentry.Replay({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    */
    
    // Set environment based on NODE_ENV
    environment: process.env.NODE_ENV || 'development',
    
    // Add release version if available
    release: process.env.VITE_APP_VERSION || undefined,
  });

  // Add global error handlers
  window.addEventListener('error', (event) => {
    Sentry.captureException(event.error);
  });

  window.addEventListener('unhandledrejection', (event) => {
    Sentry.captureException(event.reason);
  });
};

// Function to capture a custom error
export const captureError = (error: Error, extraContext?: Record<string, any>) => {
  Sentry.withScope((scope) => {
    if (extraContext) {
      Object.keys(extraContext).forEach(key => {
        scope.setExtra(key, extraContext[key]);
      });
    }
    Sentry.captureException(error);
  });
};

// Function to set user context
export const setUserContext = (user: { id: string; email?: string; username?: string }) => {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
  });
};

// Function to clear user context
export const clearUserContext = () => {
  Sentry.setUser(null);
};

// Function to add breadcrumbs
export const addBreadcrumb = (breadcrumb: Sentry.Breadcrumb) => {
  Sentry.addBreadcrumb(breadcrumb);
};