"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateVerificationApplicationSchema = exports.CreateVerificationApplicationSchema = exports.VerificationApplicationSchema = exports.CertificateSchema = exports.VerificationHistorySchema = void 0;
const zod_1 = require("zod");
const verification_stage_enum_js_1 = require("../enums/verification-stage.enum.js");
const verification_tier_enum_js_1 = require("../enums/verification-tier.enum.js");
exports.VerificationHistorySchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    userId: zod_1.z.string().uuid(),
    stage: zod_1.z.nativeEnum(verification_stage_enum_js_1.VerificationStage),
    status: zod_1.z.enum(['PENDING', 'APPROVED', 'REJECTED']),
    reviewerId: zod_1.z.string().uuid().optional(),
    notes: zod_1.z.string().optional(),
    timestamp: zod_1.z.number().int().positive()
});
exports.CertificateSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    userId: zod_1.z.string().uuid(),
    title: zod_1.z.string().min(1),
    issuer: zod_1.z.string().min(1),
    date: zod_1.z.string(),
    tier: zod_1.z.nativeEnum(verification_tier_enum_js_1.VerificationTier)
});
exports.VerificationApplicationSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    userId: zod_1.z.string().uuid(),
    lineage: zod_1.z.string().min(1),
    mentorEndorsements: zod_1.z.array(zod_1.z.string().uuid()).min(1),
    yearsOfService: zod_1.z.number().int().positive(),
    documentation: zod_1.z.array(zod_1.z.string().url()),
    specialization: zod_1.z.array(zod_1.z.string().min(1)),
    languages: zod_1.z.array(zod_1.z.string().min(1)),
    currentStage: zod_1.z.nativeEnum(verification_stage_enum_js_1.VerificationStage),
    tier: zod_1.z.nativeEnum(verification_tier_enum_js_1.VerificationTier).optional(),
    history: zod_1.z.array(exports.VerificationHistorySchema),
    submittedAt: zod_1.z.date(),
    updatedAt: zod_1.z.date()
});
exports.CreateVerificationApplicationSchema = exports.VerificationApplicationSchema.omit({
    id: true,
    userId: true,
    currentStage: true,
    tier: true,
    history: true,
    submittedAt: true,
    updatedAt: true
});
exports.UpdateVerificationApplicationSchema = zod_1.z.object({
    currentStage: zod_1.z.nativeEnum(verification_stage_enum_js_1.VerificationStage).optional(),
    tier: zod_1.z.nativeEnum(verification_tier_enum_js_1.VerificationTier).optional(),
    reviewerId: zod_1.z.string().uuid().optional(),
    notes: zod_1.z.string().optional(),
    status: zod_1.z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional()
});
//# sourceMappingURL=verification.schema.js.map