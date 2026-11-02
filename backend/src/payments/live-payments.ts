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

export function assertLivePayments(env: NodeJS.ProcessEnv = process.env): void {
  if (paystackTestKeyInProduction(env)) {
    const message = 'Payments are not switched on yet. Please check back soon.';
    // userMessage too, or the error filter replaces it with a generic 503 line.
    throw new ServiceUnavailableException({ message, userMessage: message });
  }
}
