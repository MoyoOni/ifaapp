import React from 'react';
import { captureException } from '@/shared/config/sentry';

/**
 * Test page for verifying Sentry error tracking.
 * Access at /test-sentry (add route in App.tsx)
 */
export default function SentryTestPage() {
    const [lastError, setLastError] = React.useState<string | null>(null);

    const testError = () => {
        try {
            throw new Error('[TEST] Frontend Sentry test error - this should appear in Sentry dashboard');
        } catch (error) {
            setLastError('Error thrown! Check Sentry dashboard.');
            throw error; // Re-throw to trigger Sentry
        }
    };

    const testManualCapture = () => {
        try {
            throw new Error('[TEST] Manually captured frontend error');
        } catch (error) {
            captureException(error, {
                testContext: 'manual-capture-button',
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
            });
            setLastError('Error manually captured! Check Sentry dashboard.');
        }
    };

    const testAsyncError = async () => {
        try {
            await new Promise((_, reject) => {
                setTimeout(() => {
                    reject(new Error('[TEST] Async error test'));
                }, 100);
            });
        } catch (error) {
            setLastError('Async error thrown! Check Sentry dashboard.');
            throw error;
        }
    };

    const testNetworkError = async () => {
        try {
            const response = await fetch('https://api.example.com/nonexistent-endpoint');
            if (!response.ok) {
                throw new Error(`[TEST] Network error: ${response.status}`);
            }
        } catch (error) {
            captureException(error, {
                testContext: 'network-error-test',
                endpoint: 'https://api.example.com/nonexistent-endpoint',
            });
            setLastError('Network error captured! Check Sentry dashboard.');
        }
    };

    const sentryConfigured = !!import.meta.env.VITE_SENTRY_DSN;

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <h1 className="text-3xl font-bold mb-2">Sentry Test Page</h1>
                    <p className="text-gray-600 mb-6">
                        Use these buttons to test Sentry error tracking
                    </p>

                    {/* Configuration Status */}
                    <div className={`p-4 rounded-lg mb-6 ${sentryConfigured ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                        <h2 className="font-semibold mb-2">
                            {sentryConfigured ? '✅ Sentry Configured' : '⚠️ Sentry Not Configured'}
                        </h2>
                        <p className="text-sm text-gray-700">
                            {sentryConfigured
                                ? 'VITE_SENTRY_DSN is set. Errors will be sent to Sentry.'
                                : 'VITE_SENTRY_DSN is not set. Errors will only appear in console.'}
                        </p>
                        {!sentryConfigured && (
                            <p className="text-sm text-gray-600 mt-2">
                                Add <code className="bg-gray-200 px-1 rounded">VITE_SENTRY_DSN</code> to your .env file to enable Sentry.
                            </p>
                        )}
                    </div>

                    {/* Test Buttons */}
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-semibold mb-2">1. Uncaught Error Test</h3>
                            <button
                                onClick={testError}
                                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
                            >
                                Throw Uncaught Error
                            </button>
                            <p className="text-sm text-gray-600 mt-1">
                                Throws an error that will be caught by Sentry's global error handler
                            </p>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-2">2. Manual Capture Test</h3>
                            <button
                                onClick={testManualCapture}
                                className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 transition"
                            >
                                Manually Capture Error
                            </button>
                            <p className="text-sm text-gray-600 mt-1">
                                Catches error and manually sends to Sentry with custom context
                            </p>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-2">3. Async Error Test</h3>
                            <button
                                onClick={testAsyncError}
                                className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition"
                            >
                                Throw Async Error
                            </button>
                            <p className="text-sm text-gray-600 mt-1">
                                Tests error handling in async/promise context
                            </p>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-2">4. Network Error Test</h3>
                            <button
                                onClick={testNetworkError}
                                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                            >
                                Simulate Network Error
                            </button>
                            <p className="text-sm text-gray-600 mt-1">
                                Tests error capture for failed API requests
                            </p>
                        </div>
                    </div>

                    {/* Status */}
                    {lastError && (
                        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <h3 className="font-semibold mb-1">Last Action:</h3>
                            <p className="text-sm">{lastError}</p>
                            {sentryConfigured && (
                                <p className="text-sm text-gray-600 mt-2">
                                    Check your Sentry dashboard at{' '}
                                    <a
                                        href="https://sentry.io"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline"
                                    >
                                        sentry.io
                                    </a>
                                </p>
                            )}
                        </div>
                    )}

                    {/* Instructions */}
                    <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                        <h3 className="font-semibold mb-2">How to Use:</h3>
                        <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                            <li>Ensure Sentry is configured (VITE_SENTRY_DSN set)</li>
                            <li>Click any test button above</li>
                            <li>Open Sentry dashboard (sentry.io)</li>
                            <li>Navigate to Issues → find the test error</li>
                            <li>Verify error details, stack trace, and context</li>
                        </ol>
                    </div>

                    {/* Backend Tests */}
                    <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                        <h3 className="font-semibold mb-2">Backend Test Endpoints:</h3>
                        <p className="text-sm text-gray-700 mb-2">
                            Test backend Sentry integration using these endpoints:
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                            <li>
                                <code className="bg-gray-200 px-1 rounded">GET /api/test/sentry/error</code> - Uncaught error
                            </li>
                            <li>
                                <code className="bg-gray-200 px-1 rounded">GET /api/test/sentry/http-exception</code> - HTTP exception
                            </li>
                            <li>
                                <code className="bg-gray-200 px-1 rounded">POST /api/test/sentry/manual-capture</code> - Manual capture
                            </li>
                            <li>
                                <code className="bg-gray-200 px-1 rounded">GET /api/test/health</code> - Check Sentry config
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
