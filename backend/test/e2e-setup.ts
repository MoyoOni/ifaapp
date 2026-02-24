/**
 * E2E setup: mock Sentry and set test env so the app can boot.
 */
process.env.NODE_ENV = 'test';
if (!process.env.ENCRYPTION_KEY || process.env.ENCRYPTION_KEY.length !== 32) {
  process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef';
}

jest.mock('@sentry/node', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  setUser: jest.fn(),
  setTag: jest.fn(),
}));
jest.mock('@sentry/profiling-node', () => ({
  nodeProfilingIntegration: jest.fn(() => ({})),
}));
