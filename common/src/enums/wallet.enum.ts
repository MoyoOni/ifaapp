/**
 * Wallet & Escrow Enums
 * Financial transaction types and statuses
 */

export enum TransactionType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  PAYMENT = 'PAYMENT',
  REFUND = 'REFUND',
  ESCROW_HOLD = 'ESCROW_HOLD',
  ESCROW_RELEASE = 'ESCROW_RELEASE',
  TRANSFER = 'TRANSFER',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum EscrowType {
  BOOKING = 'BOOKING', // Babalawo appointment
  ORDER = 'ORDER', // Marketplace order
  TUTOR_SESSION = 'TUTOR_SESSION', // Tutor booking
  GUIDANCE_PLAN = 'GUIDANCE_PLAN', // Akose/Ebo guidance plan (formerly Prescription)
}

export enum EscrowStatus {
  HOLD = 'HOLD', // Funds held in escrow
  RELEASED = 'RELEASED', // Funds released to recipient
  PARTIALLY_RELEASED = 'PARTIALLY_RELEASED', // Multi-tier: some funds released
  DISPUTED = 'DISPUTED', // Dispute filed, funds frozen
  CANCELLED = 'CANCELLED', // Escrow cancelled, funds returned
  EXPIRED = 'EXPIRED', // Auto-expired, refunded to sender
}

export enum WithdrawalStatus {
  PENDING = 'PENDING', // Awaiting admin approval
  APPROVED = 'APPROVED', // Approved, processing
  REJECTED = 'REJECTED', // Rejected by admin
  PROCESSED = 'PROCESSED', // Successfully processed
}

export enum Currency {
  NGN = 'NGN', // Nigerian Naira
  USD = 'USD', // US Dollar
  GBP = 'GBP', // British Pound
  CAD = 'CAD', // Canadian Dollar
  EUR = 'EUR', // Euro
}
