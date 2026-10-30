jest.mock('@sentry/node', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  setUser: jest.fn(),
  addBreadcrumb: jest.fn(),
  flush: jest.fn().mockResolvedValue(true),
}));

import * as SentrySdk from '@sentry/node';

const ENV = { ...process.env };

function loadFresh(): typeof import('./sentry') {
  let mod!: typeof import('./sentry');
  jest.isolateModules(() => {
    mod = require('./sentry');
  });
  return mod;
}

describe('backend Sentry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...ENV };
  });
  afterAll(() => {
    process.env = ENV;
  });

  // The package was never installed, and the old loader swallowed the
  // require failure, so production silently reported nothing.
  it('has @sentry/node installed as a real dependency', () => {
    const pkg = require('../package.json');
    expect(pkg.dependencies['@sentry/node']).toBeDefined();
    expect(() => jest.requireActual('@sentry/node')).not.toThrow();
  });

  it('stays off without a DSN', () => {
    delete process.env.SENTRY_DSN;
    process.env.NODE_ENV = 'production';
    const s = loadFresh();
    expect(s.initSentry()).toBe(false);
    s.captureException(new Error('x'));
    expect(SentrySdk.init).not.toHaveBeenCalled();
    expect(SentrySdk.captureException).not.toHaveBeenCalled();
  });

  it('stays off in development even with a DSN', () => {
    process.env.SENTRY_DSN = 'https://k@o1.ingest.sentry.io/1';
    process.env.NODE_ENV = 'development';
    expect(loadFresh().initSentry()).toBe(false);
    expect(SentrySdk.init).not.toHaveBeenCalled();
  });

  it('initializes in production and forwards captured errors with context', () => {
    process.env.SENTRY_DSN = ' https://k@o1.ingest.sentry.io/1 ';
    process.env.NODE_ENV = 'production';
    const s = loadFresh();
    expect(s.initSentry()).toBe(true);
    expect(SentrySdk.init).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: 'https://k@o1.ingest.sentry.io/1',
        environment: 'production',
        sendDefaultPii: false,
      })
    );
    // No beforeSend: the old one dropped every event from users outside Nigeria.
    expect((SentrySdk.init as jest.Mock).mock.calls[0][0].beforeSend).toBeUndefined();

    const err = new Error('boom');
    s.captureException(err, { url: '/api/x' });
    expect(SentrySdk.captureException).toHaveBeenCalledWith(err, { extra: { url: '/api/x' } });
  });

  it('keeps the app running if init throws', () => {
    process.env.SENTRY_DSN = 'https://k@o1.ingest.sentry.io/1';
    process.env.NODE_ENV = 'production';
    (SentrySdk.init as jest.Mock).mockImplementationOnce(() => {
      throw new Error('bad dsn');
    });
    const s = loadFresh();
    expect(s.initSentry()).toBe(false);
    s.captureException(new Error('x'));
    expect(SentrySdk.captureException).not.toHaveBeenCalled();
  });
});
