"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTransactionsQuerySchema = exports.ReleaseEscrowDtoSchema = exports.CreateEscrowDtoSchema = exports.CreateWithdrawalRequestDtoSchema = exports.CreateDepositDtoSchema = exports.WithdrawalRequestSchema = exports.EscrowSchema = exports.TransactionSchema = exports.WalletSchema = void 0;
const zod_1 = require("zod");
const wallet_enum_js_1 = require("../enums/wallet.enum.js");
exports.WalletSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    userId: zod_1.z.string().uuid(),
    balance: zod_1.z.number().min(0),
    currency: zod_1.z.nativeEnum(wallet_enum_js_1.Currency),
    locked: zod_1.z.boolean(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
});
exports.TransactionSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    walletId: zod_1.z.string().uuid(),
    userId: zod_1.z.string().uuid(),
    type: zod_1.z.nativeEnum(wallet_enum_js_1.TransactionType),
    amount: zod_1.z.number(),
    currency: zod_1.z.nativeEnum(wallet_enum_js_1.Currency),
    status: zod_1.z.nativeEnum(wallet_enum_js_1.TransactionStatus),
    description: zod_1.z.string().optional(),
    reference: zod_1.z.string().optional(),
    metadata: zod_1.z.record(zod_1.z.unknown()).optional(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
});
exports.EscrowSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    userId: zod_1.z.string().uuid(),
    recipientId: zod_1.z.string().uuid().optional(),
    walletId: zod_1.z.string().uuid(),
    amount: zod_1.z.number().min(0),
    currency: zod_1.z.nativeEnum(wallet_enum_js_1.Currency),
    type: zod_1.z.nativeEnum(wallet_enum_js_1.EscrowType),
    relatedId: zod_1.z.string().optional(),
    status: zod_1.z.nativeEnum(wallet_enum_js_1.EscrowStatus),
    autoReleaseAt: zod_1.z.date().optional(),
    releasedAt: zod_1.z.date().optional(),
    releasedBy: zod_1.z.string().uuid().optional(),
    disputeId: zod_1.z.string().uuid().optional(),
    notes: zod_1.z.string().optional(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
});
exports.WithdrawalRequestSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    userId: zod_1.z.string().uuid(),
    escrowId: zod_1.z.string().uuid().optional(),
    amount: zod_1.z.number().min(0),
    currency: zod_1.z.nativeEnum(wallet_enum_js_1.Currency),
    bankAccount: zod_1.z.string().optional(),
    bankName: zod_1.z.string().optional(),
    accountName: zod_1.z.string().optional(),
    status: zod_1.z.nativeEnum(wallet_enum_js_1.WithdrawalStatus),
    adminNotes: zod_1.z.string().optional(),
    processedAt: zod_1.z.date().optional(),
    processedBy: zod_1.z.string().uuid().optional(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
});
exports.CreateDepositDtoSchema = zod_1.z.object({
    amount: zod_1.z.number().min(0.01),
    currency: zod_1.z.nativeEnum(wallet_enum_js_1.Currency).default(wallet_enum_js_1.Currency.NGN),
    reference: zod_1.z.string().optional(),
});
exports.CreateWithdrawalRequestDtoSchema = zod_1.z.object({
    amount: zod_1.z.number().min(0.01),
    currency: zod_1.z.nativeEnum(wallet_enum_js_1.Currency).default(wallet_enum_js_1.Currency.NGN),
    bankAccount: zod_1.z.string().optional(),
    bankName: zod_1.z.string().optional(),
    accountName: zod_1.z.string().optional(),
    escrowId: zod_1.z.string().uuid().optional(),
});
exports.CreateEscrowDtoSchema = zod_1.z.object({
    recipientId: zod_1.z.string().uuid().optional(),
    amount: zod_1.z.number().min(0.01),
    currency: zod_1.z.nativeEnum(wallet_enum_js_1.Currency).default(wallet_enum_js_1.Currency.NGN),
    type: zod_1.z.nativeEnum(wallet_enum_js_1.EscrowType),
    relatedId: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
});
exports.ReleaseEscrowDtoSchema = zod_1.z.object({
    escrowId: zod_1.z.string().uuid(),
    notes: zod_1.z.string().optional(),
});
exports.GetTransactionsQuerySchema = zod_1.z.object({
    type: zod_1.z.nativeEnum(wallet_enum_js_1.TransactionType).optional(),
    status: zod_1.z.nativeEnum(wallet_enum_js_1.TransactionStatus).optional(),
    startDate: zod_1.z.string().optional(),
    endDate: zod_1.z.string().optional(),
    limit: zod_1.z.number().int().positive().max(100).default(50),
    offset: zod_1.z.number().int().nonnegative().default(0),
});
//# sourceMappingURL=wallet.schema.js.map