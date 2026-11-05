import { ArgumentsHost, BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { GlobalExceptionFilter } from './global-exception.filter';
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
});
