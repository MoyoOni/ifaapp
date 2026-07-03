import { z } from 'zod';
import { TempleType, TempleStatus } from '../enums/temple.enum.js';

/**
 * Social Links Schema for Temple
 */
export const TempleSocialLinksSchema = z.object({
  facebook: z.string().url().optional(),
  instagram: z.string().url().optional(),
  twitter: z.string().url().optional(),
  youtube: z.string().url().optional(),
  website: z.string().url().optional(),
});

/**
 * Coordinates Schema
 */
export const CoordinatesSchema = z.object({
  lat: z.number(),
  lng: z.number(),
});

/**
 * Temple Schema
 * Represents an Ifá/Isese temple (Ilé)
 * NOTE: Only Master-tier Babalawos or Advisory Board approved users can create Ilé Ifá
 */
export const TempleSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  yorubaName: z.string().optional(),
  slug: z.string().min(1),
  description: z.string().optional(),
  history: z.string().optional(),
  mission: z.string().optional(),

  // Location & Contact
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().default('Nigeria'),
  location: z.string().optional(),
  coordinates: CoordinatesSchema.optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),

  // Visual Identity
  logo: z.string().url().optional(),
  bannerImage: z.string().url().optional(),
  images: z.array(z.string().url()).default([]),

  // Leadership & Structure
  founderId: z.string().uuid().optional(),
  foundedYear: z.number().int().min(1000).max(3000).optional(),

  // Status & Verification
  status: z.nativeEnum(TempleStatus).default(TempleStatus.ACTIVE),
  verified: z.boolean().default(false),
  verifiedAt: z.date().optional(),
  verifiedBy: z.string().uuid().optional(),

  // Temple Type
  type: z.nativeEnum(TempleType).default(TempleType.STUDY_CIRCLE),

  // Cultural Information
  lineage: z.string().optional(),
  tradition: z.string().optional(),
  specialties: z.array(z.string()).default([]),

  // Social Links
  socialLinks: TempleSocialLinksSchema.optional(),

  // Statistics (cached)
  babalawoCount: z.number().int().nonnegative().default(0),
  clientCount: z.number().int().nonnegative().default(0),

  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Temple = z.infer<typeof TempleSchema>;
export type TempleSocialLinks = z.infer<typeof TempleSocialLinksSchema>;
export type Coordinates = z.infer<typeof CoordinatesSchema>;

/**
 * Create Temple DTO Schema
 * NOTE: Temple creation is restricted to Master-tier Babalawos or Advisory Board approval
 */
export const CreateTempleSchema = TempleSchema.omit({
  id: true,
  verified: true,
  verifiedAt: true,
  verifiedBy: true,
  babalawoCount: true,
  clientCount: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  slug: z.string().regex(/^[a-z0-9-]+$/, {
    message: 'Slug must contain only lowercase letters, numbers, and hyphens',
  }),
});

export type CreateTempleDto = z.infer<typeof CreateTempleSchema>;

/**
 * Update Temple DTO Schema
 * NOTE: Only founder or admin can update temple
 */
export const UpdateTempleSchema = TempleSchema.partial().omit({
  id: true,
  founderId: true,
  babalawoCount: true,
  clientCount: true,
  createdAt: true,
  updatedAt: true,
});

export type UpdateTempleDto = z.infer<typeof UpdateTempleSchema>;

/**
 * Temple with Relations Schema
 * Includes founder and babalawos
 */
export const TempleWithRelationsSchema = TempleSchema.extend({
  founder: z.object({
    id: z.string().uuid(),
    name: z.string(),
    yorubaName: z.string().optional(),
    avatar: z.string().url().optional(),
    verified: z.boolean(),
  }).optional(),
  babalawos: z.array(z.object({
    id: z.string().uuid(),
    name: z.string(),
    yorubaName: z.string().optional(),
    avatar: z.string().url().optional(),
    verified: z.boolean(),
    bio: z.string().optional(),
    location: z.string().optional(),
    culturalLevel: z.string().optional(),
    certificates: z.array(z.object({
      tier: z.string(),
    })).optional(),
    verificationApps: z.array(z.object({
      tier: z.string().nullable().optional(),
      currentStage: z.string(),
    })).optional(),
  })).optional(),
  _count: z.object({
    babalawos: z.number().int().nonnegative(),
  }).optional(),
});

export type TempleWithRelations = z.infer<typeof TempleWithRelationsSchema>;
