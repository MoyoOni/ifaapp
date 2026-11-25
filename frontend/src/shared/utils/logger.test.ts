import { describe, it, expect, vi, afterEach } from 'vitest';
import { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from 'axios';
import { logger, setLogContext, clearLogContext } from './logger';

const EMAIL = 'canary-7f3a@harness.invalid';
const PASSWORD = 'CANARY-pw-7f3a9';
const TOKEN = 'CANARY-TOKEN-5b21e0';
const USER_ID = 'user-CANARY-42';

function loginFailure(): AxiosError {
  const config = {
    url: `/auth/login?next=${TOKEN}`,
    method: 'post',
    data: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    headers: new AxiosHeaders({ Authorization: `Bearer ${TOKEN}` }),
  } as unknown as InternalAxiosRequestConfig;
  return new AxiosError(`Request failed for ${EMAIL}`, 'ERR_BAD_REQUEST', config, {}, {
    status: 401, statusText: 'x', data: { message: `Wrong password for ${EMAIL}` }, headers: {}, config,
  } as never);
}
const allText = (spy: ReturnType<typeof vi.spyOn>) => JSON.stringify(spy.mock.calls);

describe('logger warn/error never emit raw values', () => {
  afterEach(() => { vi.restoreAllMocks(); clearLogContext(); });

  it('error: an Axios error with a request body, nested objects and strings', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    logger.error('Login failed', loginFailure(), { user: { password: PASSWORD } }, TOKEN, [EMAIL]);
    const text = allText(spy);
    for (const c of [EMAIL, PASSWORD, TOKEN, 'CANARY']) expect(text).not.toContain(c);
    expect(spy.mock.calls[0][2]).toMatchObject({ kind: 'http', route: '/auth/login', httpStatus: 401 });
  });

  it('warn: same rules', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    logger.warn('Cache read failed', `key-${TOKEN}`, new Error(PASSWORD));
    const text = allText(spy);
    for (const c of [PASSWORD, TOKEN]) expect(text).not.toContain(c);
  });

  it('error: a numeric identifier after the message is not emitted', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    logger.error('Payment failed', 2348031234567, true);
    const text = allText(spy);
    expect(text).not.toContain('2348031234567');
    expect(spy.mock.calls[0].slice(2)).toEqual(['[number]', '[boolean]']);
  });

  it('the prefix carries no user ID', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    setLogContext({ userId: USER_ID });
    logger.error('Something failed');
    expect(allText(spy)).not.toContain(USER_ID);
  });

  it('the prefix shows a request ID only if it is a valid UUID', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    setLogContext({ traceId: `not-a-uuid ${TOKEN}` });
    logger.error('First');
    setLogContext({ traceId: '3f2c1a9e-8b7d-4c6e-9f10-a1b2c3d4e5f6' });
    logger.error('Second');
    expect(allText(spy)).not.toContain(TOKEN);
    expect(spy.mock.calls[1][0]).toContain('3f2c1a9e-8b7d-4c6e-9f10-a1b2c3d4e5f6');
  });

  it('structured logging (which serialised arbitrary objects) no longer exists', () => {
    expect('structured' in logger).toBe(false);
  });
});
