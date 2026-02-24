import { z } from 'zod';
import { VerificationStage } from '../enums/verification-stage.enum.js';
import { VerificationTier } from '../enums/verification-tier.enum.js';
export declare const VerificationHistorySchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    stage: z.ZodNativeEnum<typeof VerificationStage>;
    status: z.ZodEnum<["PENDING", "APPROVED", "REJECTED"]>;
    reviewerId: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    id: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    userId: string;
    timestamp: number;
    stage: VerificationStage;
    notes?: string | undefined;
    reviewerId?: string | undefined;
}, {
    id: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    userId: string;
    timestamp: number;
    stage: VerificationStage;
    notes?: string | undefined;
    reviewerId?: string | undefined;
}>;
export type VerificationHistory = z.infer<typeof VerificationHistorySchema>;
export declare const CertificateSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    title: z.ZodString;
    issuer: z.ZodString;
    date: z.ZodString;
    tier: z.ZodNativeEnum<typeof VerificationTier>;
}, "strip", z.ZodTypeAny, {
    id: string;
    issuer: string;
    userId: string;
    title: string;
    date: string;
    tier: VerificationTier;
}, {
    id: string;
    issuer: string;
    userId: string;
    title: string;
    date: string;
    tier: VerificationTier;
}>;
export type Certificate = z.infer<typeof CertificateSchema>;
export declare const VerificationApplicationSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    lineage: z.ZodString;
    mentorEndorsements: z.ZodArray<z.ZodString, "many">;
    yearsOfService: z.ZodNumber;
    documentation: z.ZodArray<z.ZodString, "many">;
    specialization: z.ZodArray<z.ZodString, "many">;
    languages: z.ZodArray<z.ZodString, "many">;
    currentStage: z.ZodNativeEnum<typeof VerificationStage>;
    tier: z.ZodOptional<z.ZodNativeEnum<typeof VerificationTier>>;
    history: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        userId: z.ZodString;
        stage: z.ZodNativeEnum<typeof VerificationStage>;
        status: z.ZodEnum<["PENDING", "APPROVED", "REJECTED"]>;
        reviewerId: z.ZodOptional<z.ZodString>;
        notes: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        id: string;
        status: "PENDING" | "APPROVED" | "REJECTED";
        userId: string;
        timestamp: number;
        stage: VerificationStage;
        notes?: string | undefined;
        reviewerId?: string | undefined;
    }, {
        id: string;
        status: "PENDING" | "APPROVED" | "REJECTED";
        userId: string;
        timestamp: number;
        stage: VerificationStage;
        notes?: string | undefined;
        reviewerId?: string | undefined;
    }>, "many">;
    submittedAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    updatedAt: Date;
    userId: string;
    languages: string[];
    specialization: string[];
    history: {
        id: string;
        status: "PENDING" | "APPROVED" | "REJECTED";
        userId: string;
        timestamp: number;
        stage: VerificationStage;
        notes?: string | undefined;
        reviewerId?: string | undefined;
    }[];
    lineage: string;
    mentorEndorsements: string[];
    yearsOfService: number;
    documentation: string[];
    currentStage: VerificationStage;
    submittedAt: Date;
    tier?: VerificationTier | undefined;
}, {
    id: string;
    updatedAt: Date;
    userId: string;
    languages: string[];
    specialization: string[];
    history: {
        id: string;
        status: "PENDING" | "APPROVED" | "REJECTED";
        userId: string;
        timestamp: number;
        stage: VerificationStage;
        notes?: string | undefined;
        reviewerId?: string | undefined;
    }[];
    lineage: string;
    mentorEndorsements: string[];
    yearsOfService: number;
    documentation: string[];
    currentStage: VerificationStage;
    submittedAt: Date;
    tier?: VerificationTier | undefined;
}>;
export type VerificationApplication = z.infer<typeof VerificationApplicationSchema>;
export declare const CreateVerificationApplicationSchema: z.ZodObject<Omit<{
    id: z.ZodString;
    userId: z.ZodString;
    lineage: z.ZodString;
    mentorEndorsements: z.ZodArray<z.ZodString, "many">;
    yearsOfService: z.ZodNumber;
    documentation: z.ZodArray<z.ZodString, "many">;
    specialization: z.ZodArray<z.ZodString, "many">;
    languages: z.ZodArray<z.ZodString, "many">;
    currentStage: z.ZodNativeEnum<typeof VerificationStage>;
    tier: z.ZodOptional<z.ZodNativeEnum<typeof VerificationTier>>;
    history: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        userId: z.ZodString;
        stage: z.ZodNativeEnum<typeof VerificationStage>;
        status: z.ZodEnum<["PENDING", "APPROVED", "REJECTED"]>;
        reviewerId: z.ZodOptional<z.ZodString>;
        notes: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        id: string;
        status: "PENDING" | "APPROVED" | "REJECTED";
        userId: string;
        timestamp: number;
        stage: VerificationStage;
        notes?: string | undefined;
        reviewerId?: string | undefined;
    }, {
        id: string;
        status: "PENDING" | "APPROVED" | "REJECTED";
        userId: string;
        timestamp: number;
        stage: VerificationStage;
        notes?: string | undefined;
        reviewerId?: string | undefined;
    }>, "many">;
    submittedAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "id" | "updatedAt" | "userId" | "history" | "tier" | "currentStage" | "submittedAt">, "strip", z.ZodTypeAny, {
    languages: string[];
    specialization: string[];
    lineage: string;
    mentorEndorsements: string[];
    yearsOfService: number;
    documentation: string[];
}, {
    languages: string[];
    specialization: string[];
    lineage: string;
    mentorEndorsements: string[];
    yearsOfService: number;
    documentation: string[];
}>;
export type CreateVerificationApplicationDto = z.infer<typeof CreateVerificationApplicationSchema>;
export declare const UpdateVerificationApplicationSchema: z.ZodObject<{
    currentStage: z.ZodOptional<z.ZodNativeEnum<typeof VerificationStage>>;
    tier: z.ZodOptional<z.ZodNativeEnum<typeof VerificationTier>>;
    reviewerId: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["PENDING", "APPROVED", "REJECTED"]>>;
}, "strip", z.ZodTypeAny, {
    status?: "PENDING" | "APPROVED" | "REJECTED" | undefined;
    notes?: string | undefined;
    tier?: VerificationTier | undefined;
    currentStage?: VerificationStage | undefined;
    reviewerId?: string | undefined;
}, {
    status?: "PENDING" | "APPROVED" | "REJECTED" | undefined;
    notes?: string | undefined;
    tier?: VerificationTier | undefined;
    currentStage?: VerificationStage | undefined;
    reviewerId?: string | undefined;
}>;
export type UpdateVerificationApplicationDto = z.infer<typeof UpdateVerificationApplicationSchema>;
