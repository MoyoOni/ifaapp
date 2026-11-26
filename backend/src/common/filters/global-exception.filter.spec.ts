import { ArgumentsHost, BadRequestException, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { GlobalExceptionFilter, requestPath } from './global-exception.filter';
import { captureException } from '../../sentry';

jest.mock('../../sentry', () => ({ captureException: jest.fn() }));

describe('GlobalExceptionFilter', () => {
  const json = jest.fn();
  const status = jest.fn(() => ({ json }));
  const host = {
    switchToHttp: () => ({
      getResponse: () => ({ status }),
      getRequest: () => ({ method: 'POST', url: '/api/payments/initialize', headers: {} }),
    }),
  } as unknown as ArgumentsHost;
  const filter = new GlobalExceptionFilter();
  beforeEach(() => jest.clearAllMocks());

  // November 5, 2026: "payments are switched off" paged Sentry for every attempt.
  it('answers a deliberate refusal as a 503 with its message, without reporting it to Sentry', () => {
    const message = 'Payments are not switched on yet. Please check back soon.';
    filter.catch(new ServiceUnavailableException({ message, userMessage: message, expected: true }), host);
    expect(status).toHaveBeenCalledWith(503);
    expect(json.mock.calls[0][0].error).toMatchObject({ userMessage: message, statusCode: 503 });
    expect(json.mock.calls[0][0].error).not.toHaveProperty('expected');
    expect(captureException).not.toHaveBeenCalled();
  });

  it('still reports a real server failure', () => {
    filter.catch(new ServiceUnavailableException('Database service unavailable'), host);
    expect(captureException).toHaveBeenCalled();
  });

  it('does not report ordinary client errors', () => {
    filter.catch(new BadRequestException('bad input'), host);
    expect(status).toHaveBeenCalledWith(400);
    expect(captureException).not.toHaveBeenCalled();
  });

  it('does not send an unexpected error\'s internal message to clients in production', () => {
    const env = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      filter.catch(new Error('relation "users" column "x" does not exist'), host);
      expect(status).toHaveBeenCalledWith(500);
      expect(JSON.stringify(json.mock.calls[0][0])).not.toContain('relation');
      expect(captureException).toHaveBeenCalled();
    } finally {
      process.env.NODE_ENV = env;
    }
  });

  // November 26, 2026: logs and backend Sentry got request.url with its query string, so a failed
  // GET /auth/verify-email?token=… (deprecated, kept during the rollout) wrote the token to the logs.
  it('never logs or reports a query string (tokens)', () => {
    const SECRET = 'tok-SECRET-123';
    const hostFor = (url: string) =>
      ({ switchToHttp: () => ({ getResponse: () => ({ status }), getRequest: () => ({ method: 'GET', url, headers: {} }) }) }) as unknown as ArgumentsHost;
    const warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    const error = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    try {
      filter.catch(new NotFoundException('Invalid or expired verification token'), hostFor(`/api/auth/verify-email?token=${SECRET}`));
      filter.catch(new Error('boom'), hostFor(`/api/auth/verify-email?token=${SECRET}#x`));
      const logged = JSON.stringify([...warn.mock.calls, ...error.mock.calls]);
      expect(logged).toContain('/api/auth/verify-email');
      expect(logged).not.toContain(SECRET);
      expect(JSON.stringify((captureException as jest.Mock).mock.calls)).not.toContain(SECRET);
      expect((captureException as jest.Mock).mock.calls[0][1]).toMatchObject({ url: '/api/auth/verify-email' });
    } finally {
      warn.mockRestore();
      error.mockRestore();
    }
  });

  it('requestPath keeps only the path', () => {
    expect(requestPath('/api/x?token=a&b=c')).toBe('/api/x');
    expect(requestPath('/api/x#frag')).toBe('/api/x');
    expect(requestPath(undefined)).toBe('/');
  });
});
