import { ServiceUnavailableException } from '@nestjs/common';
import { ResilientThrottlerStorage } from './resilient-throttler-storage';

describe('ResilientThrottlerStorage', () => {
  const record = { totalHits: 3, timeToExpire: 10, isBlocked: false, timeToBlockExpire: 0 };

  it('passes results through while Redis works', async () => {
    const inner = { increment: jest.fn().mockResolvedValue(record) };
    await expect(new ResilientThrottlerStorage(inner).increment('k', 60, 10, 0, 'auth')).resolves.toBe(record);
    expect(inner.increment).toHaveBeenCalledWith('k', 60, 10, 0, 'auth');
  });

  it('fails CLOSED (503) for the auth brute-force limiter when Redis fails', async () => {
    const storage = new ResilientThrottlerStorage({ increment: jest.fn().mockRejectedValue(new Error("Stream isn't writeable")) });
    await expect(storage.increment('k', 60, 10, 0, 'auth')).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('fails OPEN for the general API limiter when Redis fails (no hang, no blanket 500)', async () => {
    const storage = new ResilientThrottlerStorage({ increment: jest.fn().mockRejectedValue(new Error('Connection is closed.')) });
    await expect(storage.increment('k', 60, 100, 0, 'api')).resolves.toEqual({ totalHits: 0, timeToExpire: 0, isBlocked: false, timeToBlockExpire: 0 });
  });
});
