import { z } from 'zod';
import { TransactionType, TransactionStatus, EscrowType, EscrowStatus, WithdrawalStatus, Currency } from '../enums/wallet.enum.js';
export declare const WalletSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    balance: z.ZodNumber;
    currency: z.ZodNativeEnum<typeof Currency>;
    locked: z.ZodBoolean;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    currency: Currency;
    balance: number;
    locked: boolean;
}, {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    currency: Currency;
    balance: number;
    locked: boolean;
}>;
export declare const TransactionSchema: z.ZodObject<{
    id: z.ZodString;
    walletId: z.ZodString;
    userId: z.ZodString;
    type: z.ZodNativeEnum<typeof TransactionType>;
    amount: z.ZodNumber;
    currency: z.ZodNativeEnum<typeof Currency>;
    status: z.ZodNativeEnum<typeof TransactionStatus>;
    description: z.ZodOptional<z.ZodString>;
    reference: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    type: TransactionType;
    status: TransactionStatus;
    userId: string;
    currency: Currency;
    walletId: string;
    amount: number;
    description?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
    reference?: string | undefined;
}, {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    type: TransactionType;
    status: TransactionStatus;
    userId: string;
    currency: Currency;
    walletId: string;
    amount: number;
    description?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
    reference?: string | undefined;
}>;
export declare const EscrowSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    recipientId: z.ZodOptional<z.ZodString>;
    walletId: z.ZodString;
    amount: z.ZodNumber;
    currency: z.ZodNativeEnum<typeof Currency>;
    type: z.ZodNativeEnum<typeof EscrowType>;
    relatedId: z.ZodOptional<z.ZodString>;
    status: z.ZodNativeEnum<typeof EscrowStatus>;
    autoReleaseAt: z.ZodOptional<z.ZodDate>;
    releasedAt: z.ZodOptional<z.ZodDate>;
    releasedBy: z.ZodOptional<z.ZodString>;
    disputeId: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    type: EscrowType;
    status: EscrowStatus;
    userId: string;
    currency: Currency;
    walletId: string;
    amount: number;
    notes?: string | undefined;
    recipientId?: string | undefined;
    relatedId?: string | undefined;
    autoReleaseAt?: Date | undefined;
    releasedAt?: Date | undefined;
    releasedBy?: string | undefined;
    disputeId?: string | undefined;
}, {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    type: EscrowType;
    status: EscrowStatus;
    userId: string;
    currency: Currency;
    walletId: string;
    amount: number;
    notes?: string | undefined;
    recipientId?: string | undefined;
    relatedId?: string | undefined;
    autoReleaseAt?: Date | undefined;
    releasedAt?: Date | undefined;
    releasedBy?: string | undefined;
    disputeId?: string | undefined;
}>;
export declare const WithdrawalRequestSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    escrowId: z.ZodOptional<z.ZodString>;
    amount: z.ZodNumber;
    currency: z.ZodNativeEnum<typeof Currency>;
    bankAccount: z.ZodOptional<z.ZodString>;
    bankName: z.ZodOptional<z.ZodString>;
    accountName: z.ZodOptional<z.ZodString>;
    status: z.ZodNativeEnum<typeof WithdrawalStatus>;
    adminNotes: z.ZodOptional<z.ZodString>;
    processedAt: z.ZodOptional<z.ZodDate>;
    processedBy: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    status: WithdrawalStatus;
    userId: string;
    currency: Currency;
    amount: number;
    escrowId?: string | undefined;
    bankAccount?: string | undefined;
    bankName?: string | undefined;
    accountName?: string | undefined;
    adminNotes?: string | undefined;
    processedAt?: Date | undefined;
    processedBy?: string | undefined;
}, {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    status: WithdrawalStatus;
    userId: string;
    currency: Currency;
    amount: number;
    escrowId?: string | undefined;
    bankAccount?: string | undefined;
    bankName?: string | undefined;
    accountName?: string | undefined;
    adminNotes?: string | undefined;
    processedAt?: Date | undefined;
    processedBy?: string | undefined;
}>;
export declare const CreateDepositDtoSchema: z.ZodObject<{
    amount: z.ZodNumber;
    currency: z.ZodDefault<z.ZodNativeEnum<typeof Currency>>;
    reference: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    currency: Currency;
    amount: number;
    reference?: string | undefined;
}, {
    amount: number;
    currency?: Currency | undefined;
    reference?: string | undefined;
}>;
export declare const CreateWithdrawalRequestDtoSchema: z.ZodObject<{
    amount: z.ZodNumber;
    currency: z.ZodDefault<z.ZodNativeEnum<typeof Currency>>;
    bankAccount: z.ZodOptional<z.ZodString>;
    bankName: z.ZodOptional<z.ZodString>;
    accountName: z.ZodOptional<z.ZodString>;
    escrowId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    currency: Currency;
    amount: number;
    escrowId?: string | undefined;
    bankAccount?: string | undefined;
    bankName?: string | undefined;
    accountName?: string | undefined;
}, {
    amount: number;
    escrowId?: string | undefined;
    currency?: Currency | undefined;
    bankAccount?: string | undefined;
    bankName?: string | undefined;
    accountName?: string | undefined;
}>;
export declare const CreateEscrowDtoSchema: z.ZodObject<{
    recipientId: z.ZodOptional<z.ZodString>;
    amount: z.ZodNumber;
    currency: z.ZodDefault<z.ZodNativeEnum<typeof Currency>>;
    type: z.ZodNativeEnum<typeof EscrowType>;
    relatedId: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: EscrowType;
    currency: Currency;
    amount: number;
    notes?: string | undefined;
    recipientId?: string | undefined;
    relatedId?: string | undefined;
}, {
    type: EscrowType;
    amount: number;
    notes?: string | undefined;
    currency?: Currency | undefined;
    recipientId?: string | undefined;
    relatedId?: string | undefined;
}>;
export declare const ReleaseEscrowDtoSchema: z.ZodObject<{
    escrowId: z.ZodString;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    escrowId: string;
    notes?: string | undefined;
}, {
    escrowId: string;
    notes?: string | undefined;
}>;
export declare const GetTransactionsQuerySchema: z.ZodObject<{
    type: z.ZodOptional<z.ZodNativeEnum<typeof TransactionType>>;
    status: z.ZodOptional<z.ZodNativeEnum<typeof TransactionStatus>>;
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
    limit: z.ZodDefault<z.ZodNumber>;
    offset: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    offset: number;
    type?: TransactionType | undefined;
    status?: TransactionStatus | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
}, {
    type?: TransactionType | undefined;
    status?: TransactionStatus | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
    limit?: number | undefined;
    offset?: number | undefined;
}>;
