"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerifiedTier = exports.ProductStatus = exports.ProductType = exports.OrderStatus = exports.VendorStatus = void 0;
var VendorStatus;
(function (VendorStatus) {
    VendorStatus["PENDING"] = "PENDING";
    VendorStatus["APPROVED"] = "APPROVED";
    VendorStatus["SUSPENDED"] = "SUSPENDED";
    VendorStatus["REJECTED"] = "REJECTED";
})(VendorStatus || (exports.VendorStatus = VendorStatus = {}));
var OrderStatus;
(function (OrderStatus) {
    OrderStatus["PENDING"] = "PENDING";
    OrderStatus["PAID"] = "PAID";
    OrderStatus["SHIPPED"] = "SHIPPED";
    OrderStatus["DELIVERED"] = "DELIVERED";
    OrderStatus["CANCELLED"] = "CANCELLED";
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));
var ProductType;
(function (ProductType) {
    ProductType["PHYSICAL"] = "PHYSICAL";
    ProductType["DIGITAL"] = "DIGITAL";
    ProductType["SERVICE"] = "SERVICE";
})(ProductType || (exports.ProductType = ProductType = {}));
var ProductStatus;
(function (ProductStatus) {
    ProductStatus["DRAFT"] = "DRAFT";
    ProductStatus["ACTIVE"] = "ACTIVE";
    ProductStatus["OUT_OF_STOCK"] = "OUT_OF_STOCK";
    ProductStatus["ARCHIVED"] = "ARCHIVED";
    ProductStatus["SUSPENDED"] = "SUSPENDED";
})(ProductStatus || (exports.ProductStatus = ProductStatus = {}));
var VerifiedTier;
(function (VerifiedTier) {
    VerifiedTier["COUNCIL_APPROVED"] = "COUNCIL_APPROVED";
    VerifiedTier["ARTISAN_DIRECT"] = "ARTISAN_DIRECT";
    VerifiedTier["COMMUNITY_LISTED"] = "COMMUNITY_LISTED";
})(VerifiedTier || (exports.VerifiedTier = VerifiedTier = {}));
//# sourceMappingURL=marketplace.enum.js.map