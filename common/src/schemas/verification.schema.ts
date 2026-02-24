import { z } from 'zod';
import { VerificationStage } from '../enums/verification-stage.enum.js';
import { VerificationTier } from '../enums/verification-tier.enum.js';

/**
 * Verification History Entry Schema
 * Tracks progression through the four-stage verification workflow
 */
export const VerificationHistorySchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  stage: z.nativeEnum(VerificationStage),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
  reviewerId: z.string().uuid().optional(),
  notes: z.string().optional(),
  timestamp: z.number().int().positive()
});

export type VerificationHistory = z.infer<typeof VerificationHistorySchema>;

/**
 * Certificate Schema
 * Official certifications for Babalawos
 */
export const CertificateSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  title: z.string().min(1),
  issuer: z.string().min(1),
  date: z.string(),
  tier: z.nativeEnum(VerificationTier)
});

export type Certificate = z.infer<typeof CertificateSchema>;

/**
 * Verification Application Schema
 * Complete application dossier for Babalawo verification
 */
export const VerificationApplicationSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  lineage: z.string().min(1), // Documented lineage traceable to recognized source
  mentorEndorsements: z.array(z.string().uuid()).min(1), // IDs of endorsing Babalawos
  yearsOfService: z.number().int().positive(),
  documentation: z.array(z.string().url()), // URLs to lineage documents, certificates
  specialization: z.array(z.string().min(1)),
  languages: z.array(z.string().min(1)),
  currentStage: z.nativeEnum(VerificationStage),
  tier: z.nativeEnum(VerificationTier).optional(),
  history: z.array(VerificationHistorySchema),
  submittedAt: z.date(),
  updatedAt: z.date()
});

export type VerificationApplication = z.infer<typeof VerificationApplicationSchema>;

/**
 * Create Verification Application DTO Schema
 */
export const CreateVerificationApplicationSchema = VerificationApplicationSchema.omit({
  id: true,
  userId: true,
  currentStage: true,
  tier: true,
  history: true,
  submittedAt: true,
  updatedAt: true
});

export type CreateVerificationApplicationDto = z.infer<typeof CreateVerificationApplicationSchema>;

/**
 * Update Verification Application DTO Schema
 * Used by admin/council for stage transitions
 */
export const UpdateVerificationApplicationSchema = z.object({
  currentStage: z.nativeEnum(VerificationStage).optional(),
  tier: z.nativeEnum(VerificationTier).optional(),
  reviewerId: z.string().uuid().optional(),
  notes: z.string().optional(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional()
});

export type UpdateVerificationApplicationDto = z.infer<typeof UpdateVerificationApplicationSchema>;
