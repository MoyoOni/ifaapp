import { RedisCacheService, SessionStoreUnavailableException } from './redis-cache.service';

// The strict methods back session security (revocation, refresh rotation): they must never guess.
describe('RedisCacheService strict (fail-closed) methods', () => {
  const make = (client: Record<string, jest.Mock> | null, connected = true) => {
    const svc = new RedisCacheService({ get: () => undefined } as any);
    (svc as any).client = client;
    (svc as any).isConnected = connected;
    return svc;
  };

  it('throw SessionStoreUnavailableException (503) when Redis is not connected', async () => {
    const svc = make({ exists: jest.fn() }, false);
    await expect(svc.existsStrict('k')).rejects.toBeInstanceOf(SessionStoreUnavailableException);
    await expect(svc.setStrict('k', '1', 60)).rejects.toBeInstanceOf(SessionStoreUnavailableException);
    await expect(svc.setIfAbsentStrict('k', '1', 60)).rejects.toBeInstanceOf(SessionStoreUnavailableException);
    await expect(svc.getStrict('k')).rejects.toBeInstanceOf(SessionStoreUnavailableException);
    expect(new SessionStoreUnavailableException().getStatus()).toBe(503);
  });

  it('throw when a command errors, where the lenient methods return false', async () => {
    const svc = make({ exists: jest.fn().mockRejectedValue(new Error('READONLY')) });
    await expect(svc.existsStrict('k')).rejects.toBeInstanceOf(SessionStoreUnavailableException);
    await expect(svc.exists('k')).resolves.toBe(false); // the lenient cache method, unchanged
  });

  it('throw when Redis does not answer within the time limit', async () => {
    jest.useFakeTimers();
    try {
      const svc = make({ exists: jest.fn(() => new Promise(() => undefined)) });
      const pending = expect(svc.existsStrict('k')).rejects.toBeInstanceOf(SessionStoreUnavailableException);
      await jest.advanceTimersByTimeAsync(2100);
      await pending;
    } finally {
      jest.useRealTimers();
    }
  });

  it('setIfAbsentStrict is one atomic SET … EX … NX and reports whether it created the key', async () => {
    const sendCommand = jest.fn().mockResolvedValueOnce('OK').mockResolvedValueOnce(null);
    const svc = make({ sendCommand });
    await expect(svc.setIfAbsentStrict('auth:denylist:j', 'rotated', 99.2)).resolves.toBe(true);
    await expect(svc.setIfAbsentStrict('auth:denylist:j', 'rotated', 99.2)).resolves.toBe(false);
    expect(sendCommand).toHaveBeenCalledWith(['SET', 'auth:denylist:j', '"rotated"', 'EX', '100', 'NX']);
  });

  it('existsStrict / getStrict / setStrict map replies correctly', async () => {
    const client = { exists: jest.fn().mockResolvedValue(1), get: jest.fn().mockResolvedValue('{"a":1}'), setEx: jest.fn().mockResolvedValue('OK') };
    const svc = make(client);
    await expect(svc.existsStrict('k')).resolves.toBe(true);
    await expect(svc.getStrict('k')).resolves.toEqual({ a: 1 });
    await svc.setStrict('k', '1', 0.2);
    expect(client.setEx).toHaveBeenCalledWith('k', 1, '"1"');
  });
});
