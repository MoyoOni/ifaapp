import { z } from 'zod';
import { UserRole } from '../enums/user-role.enum.js';
import { CulturalLevel } from '../enums/cultural-level.enum.js';

/**
 * Social Link Schema
 * Platform links for user profiles
 */
export const SocialLinkSchema = z.object({
  platform: z.enum(['twitter', 'instagram', 'website', 'other']),
  url: z.string().url()
});

/**
 * Base User Schema
 * Core user profile data with privacy controls
 * NOTE: Age and gender are optional - explicit opt-in required for visibility
 */
export const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
  role: z.nativeEnum(UserRole),
  yorubaName: z.string().optional(),
  avatar: z.string().url().optional(),
  verified: z.boolean().default(false),
  bio: z.string().optional(),
  aboutMe: z.string().optional(),
  gender: z.string().optional(), // Optional, privacy-controlled
  age: z.number().int().positive().optional(), // Optional, privacy-controlled
  location: z.string().optional(),
  socialLinks: z.array(SocialLinkSchema).optional(),
  culturalLevel: z.nativeEnum(CulturalLevel).default(CulturalLevel.OMO_ILE),
  rankXP: z.number().int().nonnegative().default(0),
  dialectPreference: z.string().optional(),
  hasOnboarded: z.boolean().default(false),
  interests: z.array(z.string()).optional(),
  themeColor: z.string().optional(),
  profileVisibility: z.enum(['public', 'private', 'community']).default('community'),
  templeId: z.string().uuid().optional(), // Temple affiliation
  temple: z.object({
    id: z.string().uuid(),
    name: z.string(),
    yorubaName: z.string().optional(),
    slug: z.string(),
    logo: z.string().url().optional(),
    verified: z.boolean(),
  }).optional(), // Temple relation (optional)
  createdAt: z.date(),
  updatedAt: z.date()
});

export type User = z.infer<typeof UserSchema>;
export type SocialLink = z.infer<typeof SocialLinkSchema>;

/**
 * Create User DTO Schema
 */
export const CreateUserSchema = UserSchema.omit({
  id: true,
  verified: true,
  rankXP: true,
  hasOnboarded: true,
  createdAt: true,
  updatedAt: true
}).extend({
  password: z.string().min(8)
});

export type CreateUserDto = z.infer<typeof CreateUserSchema>;

/**
 * Update User DTO Schema
 */
export const UpdateUserSchema = UserSchema.partial().omit({
  id: true,
  email: true,
  role: true,
  verified: true,
  createdAt: true,
  updatedAt: true
});

export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;
