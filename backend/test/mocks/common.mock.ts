export enum UserRole {
    ADMIN = 'ADMIN',
    BABALAWO = 'BABALAWO',
    CLIENT = 'CLIENT',
    VENDOR = 'VENDOR',
}

export enum CulturalLevel {
    OMO_ILE = 'Omo Ilé',
    ABORISA = 'Aboriṣa',
    OJE = 'Oje',
    AWO = 'Awo',
    OLUWO = 'Oluwo',
}

export enum Currency {
    NGN = 'NGN',
    USD = 'USD',
    GBP = 'GBP',
    EUR = 'EUR',
}

export enum PaymentPurpose {
    WALLET_TOPUP = 'WALLET_TOPUP',
    BOOKING = 'BOOKING',
    MARKETPLACE_ORDER = 'MARKETPLACE_ORDER',
    COURSE_ENROLLMENT = 'COURSE_ENROLLMENT',
    GUIDANCE_PLAN = 'GUIDANCE_PLAN',
}

export enum EscrowType {
    BOOKING = 'BOOKING',
    ORDER = 'ORDER',
    TUTOR_SESSION = 'TUTOR_SESSION',
    GUIDANCE_PLAN = 'GUIDANCE_PLAN',
}

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

export enum EscrowStatus {
    HOLD = 'HOLD',
    RELEASED = 'RELEASED',
    PARTIALLY_RELEASED = 'PARTIALLY_RELEASED',
    DISPUTED = 'DISPUTED',
    CANCELLED = 'CANCELLED',
    EXPIRED = 'EXPIRED',
}

export enum WithdrawalStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    PROCESSED = 'PROCESSED',
}

export enum PrivacyLevel {
    PUBLIC = 'PUBLIC',
    COMMUNITY = 'COMMUNITY',
    PRIVATE = 'PRIVATE',
    CONFIDENTIAL = 'CONFIDENTIAL',
}
