import * as Sentry from '@sentry/react';
import { isDemoMode } from '../shared/config/demo-mode';

export function initSentry() {
    const dsn = import.meta.env.VITE_SENTRY_DSN;
    const environment = import.meta.env.VITE_ENVIRONMENT || import.meta.env.MODE || 'development';

    if (dsn && environment !== 'development') {
        Sentry.init({
            dsn,
            environment,
            integrations: [
                Sentry.browserTracingIntegration(),
                Sentry.replayIntegration({
                    maskAllText: true,
                    blockAllMedia: true,
                }),
            ],
            tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
            replaysSessionSampleRate: 0.1,
            replaysOnErrorSampleRate: 1.0,
            beforeSend(event) {
                // Filter sensitive data
                if (event.request) {
                    delete event.request.cookies;
                    if (event.request.headers) {
                        delete event.request.headers.authorization;
                    }
                }
                return event;
            },
        });

        // Set demo mode tag for error tracking (HC-203.3)
        Sentry.setTag('demoMode', isDemoMode ? 'enabled' : 'disabled');

        console.log(`Sentry initialized for ${environment}`);
    } else {
        console.warn('Sentry disabled (no DSN or development mode)');
    }
}

export function setUser(user: { id: string; email?: string; role?: string }) {
    Sentry.setUser(user);
}

export function clearUser() {
    Sentry.setUser(null);
}

export function captureException(error: Error, context?: Record<string, any>) {
    Sentry.captureException(error, { extra: context });
}
