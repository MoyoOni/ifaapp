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

  it('refuses a Flutterwave test key in production too', () => {
    const flw = env({ PAYSTACK_SECRET_KEY: 'sk_live_abc', FLUTTERWAVE_SECRET_KEY: 'FLWSECK_TEST-abc-X' });
    expect(() => assertLivePayments(flw, 'FLUTTERWAVE')).toThrow(ServiceUnavailableException);
    expect(() => assertLivePayments(flw, 'PAYSTACK')).not.toThrow();
  });
});
