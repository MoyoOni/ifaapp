/**
 * Payment Enums
 * Payment purpose and provider types
 */

export enum PaymentPurpose {
  WALLET_TOPUP = 'WALLET_TOPUP',
  BOOKING = 'BOOKING',
  MARKETPLACE_ORDER = 'MARKETPLACE_ORDER',
  COURSE_ENROLLMENT = 'COURSE_ENROLLMENT',
  GUIDANCE_PLAN = 'GUIDANCE_PLAN', // Renamed from PRESCRIPTION to GUIDANCE_PLAN
}

export enum PaymentProvider {
  PAYSTACK = 'PAYSTACK',
  FLUTTERWAVE = 'FLUTTERWAVE',
}
