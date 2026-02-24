import { z } from 'zod';
import { VendorStatus, ProductStatus, OrderStatus, ProductType, VerifiedTier } from '../enums/marketplace.enum.js';

/**
 * Vendor Schema
 * Verified vendor selling cultural goods
 */
export const VendorSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  businessName: z.string().min(1),
  businessLicense: z.string().optional(),
  taxId: z.string().optional(),
  status: z.nativeEnum(VendorStatus),
  endorsementBy: z.string().uuid().optional(),
  description: z.string().optional(),
  verifiedAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export type Vendor = z.infer<typeof VendorSchema>;

/**
 * Product Schema
 * Marketplace product listing
 */
export const ProductSchema = z.object({
  id: z.string().uuid(),
  vendorId: z.string().uuid(),
  name: z.string().min(1),
  category: z.string().min(1), // artifacts, books, music, services, ingredients
  type: z.nativeEnum(ProductType),
  description: z.string().min(1),
  longDescription: z.string().optional(),
  price: z.number().positive(),
  currency: z.string().default('NGN'),
  stock: z.number().int().positive().nullable(),
  images: z.array(z.string().url()),
  provenance: z.string().optional(),
  usageProtocol: z.string().optional(),
  status: z.nativeEnum(ProductStatus),
  approvedBy: z.string().uuid().optional(),
  verifiedTier: z.nativeEnum(VerifiedTier),
  taxCompliant: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date()
});

export type Product = z.infer<typeof ProductSchema>;

/**
 * Order Schema
 * Customer order
 */
export const OrderSchema = z.object({
  id: z.string().uuid(),
  customerId: z.string().uuid(),
  vendorId: z.string().uuid(),
  status: z.nativeEnum(OrderStatus),
  totalAmount: z.number().positive(),
  currency: z.string().default('NGN'),
  taxAmount: z.number().positive().nullable(),
  shippingCost: z.number().nonnegative().nullable(),
  shippingAddress: z.string().optional(),
  paymentMethod: z.string().optional(), // paystack, stripe, bank_transfer
  paymentId: z.string().optional(),
  paidAt: z.date().nullable(),
  shippedAt: z.date().nullable(),
  deliveredAt: z.date().nullable(),
  cancelledAt: z.date().nullable(),
  notes: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export type Order = z.infer<typeof OrderSchema>;

/**
 * Order Item Schema
 * Individual product in an order
 */
export const OrderItemSchema = z.object({
  id: z.string().uuid(),
  orderId: z.string().uuid(),
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  price: z.number().positive(),
  createdAt: z.date()
});

export type OrderItem = z.infer<typeof OrderItemSchema>;

/**
 * Product Review Schema
 * Customer review/rating (culturally respectful - "acknowledge" not "like")
 */
export const ProductReviewSchema = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid(),
  customerId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  title: z.string().optional(),
  content: z.string().optional(),
  acknowledgeCount: z.number().int().nonnegative().default(0),
  status: z.string().default('ACTIVE'), // ACTIVE, HIDDEN, REMOVED
  createdAt: z.date(),
  updatedAt: z.date()
});

export type ProductReview = z.infer<typeof ProductReviewSchema>;
