"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductReviewSchema = exports.OrderItemSchema = exports.OrderSchema = exports.ProductSchema = exports.VendorSchema = void 0;
const zod_1 = require("zod");
const marketplace_enum_js_1 = require("../enums/marketplace.enum.js");
exports.VendorSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    userId: zod_1.z.string().uuid(),
    businessName: zod_1.z.string().min(1),
    businessLicense: zod_1.z.string().optional(),
    taxId: zod_1.z.string().optional(),
    status: zod_1.z.nativeEnum(marketplace_enum_js_1.VendorStatus),
    endorsementBy: zod_1.z.string().uuid().optional(),
    description: zod_1.z.string().optional(),
    verifiedAt: zod_1.z.date().optional(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date()
});
exports.ProductSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    vendorId: zod_1.z.string().uuid(),
    name: zod_1.z.string().min(1),
    category: zod_1.z.string().min(1),
    type: zod_1.z.nativeEnum(marketplace_enum_js_1.ProductType),
    description: zod_1.z.string().min(1),
    longDescription: zod_1.z.string().optional(),
    price: zod_1.z.number().positive(),
    currency: zod_1.z.string().default('NGN'),
    stock: zod_1.z.number().int().positive().nullable(),
    images: zod_1.z.array(zod_1.z.string().url()),
    provenance: zod_1.z.string().optional(),
    usageProtocol: zod_1.z.string().optional(),
    status: zod_1.z.nativeEnum(marketplace_enum_js_1.ProductStatus),
    approvedBy: zod_1.z.string().uuid().optional(),
    verifiedTier: zod_1.z.nativeEnum(marketplace_enum_js_1.VerifiedTier),
    taxCompliant: zod_1.z.boolean().default(false),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date()
});
exports.OrderSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    customerId: zod_1.z.string().uuid(),
    vendorId: zod_1.z.string().uuid(),
    status: zod_1.z.nativeEnum(marketplace_enum_js_1.OrderStatus),
    totalAmount: zod_1.z.number().positive(),
    currency: zod_1.z.string().default('NGN'),
    taxAmount: zod_1.z.number().positive().nullable(),
    shippingCost: zod_1.z.number().nonnegative().nullable(),
    shippingAddress: zod_1.z.string().optional(),
    paymentMethod: zod_1.z.string().optional(),
    paymentId: zod_1.z.string().optional(),
    paidAt: zod_1.z.date().nullable(),
    shippedAt: zod_1.z.date().nullable(),
    deliveredAt: zod_1.z.date().nullable(),
    cancelledAt: zod_1.z.date().nullable(),
    notes: zod_1.z.string().optional(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date()
});
exports.OrderItemSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    orderId: zod_1.z.string().uuid(),
    productId: zod_1.z.string().uuid(),
    quantity: zod_1.z.number().int().positive(),
    price: zod_1.z.number().positive(),
    createdAt: zod_1.z.date()
});
exports.ProductReviewSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    productId: zod_1.z.string().uuid(),
    customerId: zod_1.z.string().uuid(),
    rating: zod_1.z.number().int().min(1).max(5),
    title: zod_1.z.string().optional(),
    content: zod_1.z.string().optional(),
    acknowledgeCount: zod_1.z.number().int().nonnegative().default(0),
    status: zod_1.z.string().default('ACTIVE'),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date()
});
//# sourceMappingURL=marketplace.schema.js.map