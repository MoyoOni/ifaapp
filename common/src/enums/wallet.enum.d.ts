export declare enum TransactionType {
    DEPOSIT = "DEPOSIT",
    WITHDRAWAL = "WITHDRAWAL",
    PAYMENT = "PAYMENT",
    REFUND = "REFUND",
    ESCROW_HOLD = "ESCROW_HOLD",
    ESCROW_RELEASE = "ESCROW_RELEASE",
    TRANSFER = "TRANSFER"
}
export declare enum TransactionStatus {
    PENDING = "PENDING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    CANCELLED = "CANCELLED"
}
export declare enum EscrowType {
    BOOKING = "BOOKING",
    ORDER = "ORDER",
    TUTOR_SESSION = "TUTOR_SESSION",
    GUIDANCE_PLAN = "GUIDANCE_PLAN"
}
export declare enum EscrowStatus {
    HOLD = "HOLD",
    RELEASED = "RELEASED",
    PARTIALLY_RELEASED = "PARTIALLY_RELEASED",
    DISPUTED = "DISPUTED",
    CANCELLED = "CANCELLED",
    EXPIRED = "EXPIRED"
}
export declare enum WithdrawalStatus {
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
    PROCESSED = "PROCESSED"
}
export declare enum Currency {
    NGN = "NGN",
    USD = "USD",
    GBP = "GBP",
    CAD = "CAD",
    EUR = "EUR"
}
