/**
 * Wallet & Escrow Zod Schemas
 * Validation schemas for financial transactions
 */

import { z } from 'zod';
import {
  TransactionType,
  TransactionStatus,
  EscrowType,
  EscrowStatus,
  WithdrawalStatus,
  Currency,
} from '../enums/wallet.enum.js';

// Wallet Schema
export const WalletSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  balance: z.number().min(0),
  currency: z.nativeEnum(Currency),
  locked: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Transaction Schema
export const TransactionSchema = z.object({
  id: z.string().uuid(),
  walletId: z.string().uuid(),
  userId: z.string().uuid(),
  type: z.nativeEnum(TransactionType),
  amount: z.number(),
  currency: z.nativeEnum(Currency),
  status: z.nativeEnum(TransactionStatus),
  description: z.string().optional(),
  reference: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Escrow Schema
export const EscrowSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  recipientId: z.string().uuid().optional(),
  walletId: z.string().uuid(),
  amount: z.number().min(0),
  currency: z.nativeEnum(Currency),
  type: z.nativeEnum(EscrowType),
  relatedId: z.string().optional(),
  status: z.nativeEnum(EscrowStatus),
  autoReleaseAt: z.date().optional(),
  releasedAt: z.date().optional(),
  releasedBy: z.string().uuid().optional(),
  disputeId: z.string().uuid().optional(),
  notes: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Withdrawal Request Schema
export const WithdrawalRequestSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  escrowId: z.string().uuid().optional(),
  amount: z.number().min(0),
  currency: z.nativeEnum(Currency),
  bankAccount: z.string().optional(),
  bankName: z.string().optional(),
  accountName: z.string().optional(),
  status: z.nativeEnum(WithdrawalStatus),
  adminNotes: z.string().optional(),
  processedAt: z.date().optional(),
  processedBy: z.string().uuid().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// DTO Schemas for API requests
export const CreateDepositDtoSchema = z.object({
  amount: z.number().min(0.01),
  currency: z.nativeEnum(Currency).default(Currency.NGN),
  reference: z.string().optional(), // Payment gateway reference
});

export const CreateWithdrawalRequestDtoSchema = z.object({
  amount: z.number().min(0.01),
  currency: z.nativeEnum(Currency).default(Currency.NGN),
  bankAccount: z.string().optional(),
  bankName: z.string().optional(),
  accountName: z.string().optional(),
  escrowId: z.string().uuid().optional(),
});

export const CreateEscrowDtoSchema = z.object({
  recipientId: z.string().uuid().optional(),
  amount: z.number().min(0.01),
  currency: z.nativeEnum(Currency).default(Currency.NGN),
  type: z.nativeEnum(EscrowType),
  relatedId: z.string().optional(),
  notes: z.string().optional(),
});

export const ReleaseEscrowDtoSchema = z.object({
  escrowId: z.string().uuid(),
  notes: z.string().optional(),
});

export const GetTransactionsQuerySchema = z.object({
  type: z.nativeEnum(TransactionType).optional(),
  status: z.nativeEnum(TransactionStatus).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  limit: z.number().int().positive().max(100).default(50),
  offset: z.number().int().nonnegative().default(0),
});
