import { ServiceUnavailableException } from '@nestjs/common';

/**
 * Production must never take "payments" on a Paystack test key: anyone can
 * pay with Paystack's published test cards, and the order, booking or
 * membership would be treated as paid. Found November 2, 2026 -- production
 * had been running on an `sk_test_` key. PAYSTACK_TEST_MODE_ALLOWED=true
 * lets the local production-mode staging stack use test keys on purpose.
 */
export function paystackTestKeyInProduction(env: NodeJS.ProcessEnv = process.env): boolean {
  return (
    env.NODE_ENV === 'production' &&
    (env.PAYSTACK_SECRET_KEY ?? '').startsWith('sk_test_') &&
    env.PAYSTACK_TEST_MODE_ALLOWED !== 'true'
  );
}

/** Same rule for Flutterwave (test keys start FLWSECK_TEST-); same override. */
export function flutterwaveTestKeyInProduction(env: NodeJS.ProcessEnv = process.env): boolean {
  return (
    env.NODE_ENV === 'production' &&
    (env.FLUTTERWAVE_SECRET_KEY ?? '').startsWith('FLWSECK_TEST') &&
    env.PAYSTACK_TEST_MODE_ALLOWED !== 'true'
  );
}

export function assertLivePayments(env: NodeJS.ProcessEnv = process.env, provider: 'PAYSTACK' | 'FLUTTERWAVE' = 'PAYSTACK'): void {
  const testKey = provider === 'FLUTTERWAVE' ? flutterwaveTestKeyInProduction(env) : paystackTestKeyInProduction(env);
  if (testKey) {
    const message = 'Payments are not switched on yet. Please check back soon.';
    // userMessage too, or the error filter replaces it with a generic 503 line.
    throw new ServiceUnavailableException({ message, userMessage: message });
  }
}
