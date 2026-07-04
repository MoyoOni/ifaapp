/**
 * Webhook payload shapes for Paystack/Flutterwave (P3-05), replacing the
 * `any` these handlers previously took. Only the fields `payments.service.ts`
 * actually reads are modeled — both gateways send more fields than this, but
 * an incomplete-but-accurate type beats `any` silently accepting anything.
 * See: https://paystack.com/docs/payments/webhooks/
 *      https://developer.flutterwave.com/docs/integration-guides/webhooks
 */

export interface PaystackWebhookPayload {
  event: string;
  data: {
    reference: string;
    amount: number; // kobo (smallest currency unit) — divide by 100 for the decimal amount
    currency: string;
    metadata?: {
      userId?: string;
      [key: string]: unknown;
    } | null;
  };
}

export interface FlutterwaveWebhookPayload {
  event: string;
  data: {
    status: string;
    amount: number;
    currency: string;
    tx_ref: string;
    meta?: {
      userId?: string;
      [key: string]: unknown;
    } | null;
  };
}

export type PaymentWebhookPayload = PaystackWebhookPayload | FlutterwaveWebhookPayload;
