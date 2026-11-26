import { describe, it, expect, vi, afterEach } from 'vitest';

const init = vi.fn();
const captureException = vi.fn();
vi.mock('@sentry/react', async (orig) => ({ ...(await orig<object>()), init: (...a: unknown[]) => init(...a), captureException: (...a: unknown[]) => captureException(...a) }));

const DSN = 'https://0123456789abcdef0123456789abcdef@o1.ingest.sentry.io/2';
async function load(env: Record<string, string>) {
  vi.resetModules();
  for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v);
  return import('./sentry');
}
afterEach(() => { vi.unstubAllEnvs(); init.mockClear(); captureException.mockClear(); });

// frontend/.env.production carries the production DSN, so a local `vite build` + preview used to report to production
// Sentry. Only builds that set VITE_SENTRY_ENABLED=true (the production image, native store builds) may.
describe('Sentry is opt-in per build', () => {
  it('stays off with a DSN but without VITE_SENTRY_ENABLED (a local build)', async () => {
    const m = await load({ VITE_SENTRY_DSN: DSN, VITE_SENTRY_ENABLED: '' });
    m.initSentry();
    m.reportError(new Error('x'), 'api');
    expect(init).not.toHaveBeenCalled();
    expect(captureException).not.toHaveBeenCalled();
  });

  it.each(['false', '1', 'TRUE'])('stays off for VITE_SENTRY_ENABLED=%s', async (v) => {
    const m = await load({ VITE_SENTRY_DSN: DSN, VITE_SENTRY_ENABLED: v });
    m.initSentry();
    expect(init).not.toHaveBeenCalled();
  });

  it('turns on with VITE_SENTRY_ENABLED=true and a DSN (the production image)', async () => {
    const m = await load({ VITE_SENTRY_DSN: DSN, VITE_SENTRY_ENABLED: 'true' });
    m.initSentry();
    expect(init).toHaveBeenCalledTimes(1);
    expect(init.mock.calls[0][0]).toMatchObject({ dsn: DSN, sendDefaultPii: false });
  });
});
