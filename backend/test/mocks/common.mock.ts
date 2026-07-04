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

export enum ThreadStatus {
    ACTIVE = 'ACTIVE',
    LOCKED = 'LOCKED',
    PINNED = 'PINNED',
    ARCHIVED = 'ARCHIVED',
    DELETED = 'DELETED',
}

export enum PostStatus {
    ACTIVE = 'ACTIVE',
    EDITED = 'EDITED',
    DELETED = 'DELETED',
    HIDDEN = 'HIDDEN',
}

// P1-03: added below — the full-program type check used by
// test:integration (unlike the unit test config's isolatedModules mode)
// loads AppModule's entire dependency graph, which pulls in every one of
// these. Missing entries here surface as "Cannot read properties of
// undefined" at decorator-evaluation time, not a normal type error.

export enum AdminSubRole {
    FINANCE = 'FINANCE',
    MODERATOR = 'MODERATOR',
    COMPLIANCE = 'COMPLIANCE',
    SUPPORT = 'SUPPORT',
    SUPER = 'SUPER',
}

export enum CourseLevel {
    BEGINNER = 'BEGINNER',
    INTERMEDIATE = 'INTERMEDIATE',
    ADVANCED = 'ADVANCED',
}

export enum CourseStatus {
    DRAFT = 'DRAFT',
    PENDING_APPROVAL = 'PENDING_APPROVAL',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    ARCHIVED = 'ARCHIVED',
}

export enum LessonType {
    VIDEO = 'VIDEO',
    AUDIO = 'AUDIO',
    TEXT = 'TEXT',
    QUIZ = 'QUIZ',
}

export enum EnrollmentStatus {
    ACTIVE = 'ACTIVE',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
}

export enum VendorStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    SUSPENDED = 'SUSPENDED',
    REJECTED = 'REJECTED',
}

export enum OrderStatus {
    PENDING = 'PENDING',
    PAID = 'PAID',
    SHIPPED = 'SHIPPED',
    DELIVERED = 'DELIVERED',
    CANCELLED = 'CANCELLED',
    REFUNDED = 'REFUNDED',
}

export enum ProductType {
    PHYSICAL = 'PHYSICAL',
    DIGITAL = 'DIGITAL',
    SERVICE = 'SERVICE',
}

export enum ProductStatus {
    DRAFT = 'DRAFT',
    ACTIVE = 'ACTIVE',
    OUT_OF_STOCK = 'OUT_OF_STOCK',
    ARCHIVED = 'ARCHIVED',
    SUSPENDED = 'SUSPENDED',
}

export enum VerifiedTier {
    COUNCIL_APPROVED = 'COUNCIL_APPROVED',
    ARTISAN_DIRECT = 'ARTISAN_DIRECT',
    COMMUNITY_LISTED = 'COMMUNITY_LISTED',
}

export enum VerificationStage {
    APPLICATION = 'APPLICATION',
    COUNCIL_REVIEW = 'COUNCIL_REVIEW',
    CERTIFICATION = 'CERTIFICATION',
    ETHICS_AGREEMENT = 'ETHICS_AGREEMENT',
}

export enum VerificationTier {
    JUNIOR = 'JUNIOR',
    SENIOR = 'SENIOR',
    MASTER = 'MASTER',
}
