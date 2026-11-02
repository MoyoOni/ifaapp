import { ServiceUnavailableException } from '@nestjs/common';
import { assertLivePayments, paystackTestKeyInProduction } from './live-payments';

describe('live payments guard', () => {
  const env = (over: Record<string, string>) => ({ NODE_ENV: 'production', PAYSTACK_SECRET_KEY: 'sk_test_abc', ...over }) as NodeJS.ProcessEnv;

  it('refuses payments on a test key in production', () => {
    expect(() => assertLivePayments(env({}))).toThrow(ServiceUnavailableException);
  });

  it('allows a live key in production, and test keys anywhere else', () => {
    expect(paystackTestKeyInProduction(env({ PAYSTACK_SECRET_KEY: 'sk_live_abc' }))).toBe(false);
    expect(paystackTestKeyInProduction(env({ NODE_ENV: 'development' }))).toBe(false);
  });

  it('allows test keys in production only when explicitly allowed (local staging stack)', () => {
    expect(paystackTestKeyInProduction(env({ PAYSTACK_TEST_MODE_ALLOWED: 'true' }))).toBe(false);
  });
});
