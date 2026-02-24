export declare enum VendorStatus {
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    SUSPENDED = "SUSPENDED",
    REJECTED = "REJECTED"
}
export declare enum OrderStatus {
    PENDING = "PENDING",
    PAID = "PAID",
    SHIPPED = "SHIPPED",
    DELIVERED = "DELIVERED",
    CANCELLED = "CANCELLED"
}
export declare enum ProductType {
    PHYSICAL = "PHYSICAL",
    DIGITAL = "DIGITAL",
    SERVICE = "SERVICE"
}
export declare enum ProductStatus {
    DRAFT = "DRAFT",
    ACTIVE = "ACTIVE",
    OUT_OF_STOCK = "OUT_OF_STOCK",
    ARCHIVED = "ARCHIVED",
    SUSPENDED = "SUSPENDED"
}
export declare enum VerifiedTier {
    COUNCIL_APPROVED = "COUNCIL_APPROVED",
    ARTISAN_DIRECT = "ARTISAN_DIRECT",
    COMMUNITY_LISTED = "COMMUNITY_LISTED"
}
export type VendorStatusType = keyof typeof VendorStatus;
export type ProductStatusType = keyof typeof ProductStatus;
export type OrderStatusType = keyof typeof OrderStatus;
export type ProductTypeType = keyof typeof ProductType;
export type VerifiedTierType = keyof typeof VerifiedTier;
