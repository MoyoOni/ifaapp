/**
 * Prisma model type definitions.
 *
 * These interfaces mirror the models defined in prisma/schema.prisma.
 * They exist so that application code can reference model shapes without
 * depending on a generated @prisma/client (which may not be present in
 * every environment, e.g. CI lint-only jobs).
 *
 * If the Prisma schema changes, update these types to match.
 */

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: string;
  yorubaName?: string | null;
  avatar?: string | null;
  bio?: string | null;
  aboutMe?: string | null;
  gender?: string | null;
  age?: number | null;
  location?: string | null;
  culturalLevel: string;
  rankXP: number;
  dialectPreference?: string | null;
  themeColor?: string | null;
  profileVisibility: string;
  interests: string[];
  verified: boolean;
  hasOnboarded: boolean;
  adminSubRole?: string | null;
  templeId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  availability?: any;
}

export interface Appointment {
  id: string;
  babalawoId: string;
  clientId: string;
  date: string;
  time: string;
  duration: number;
  price?: number | null;
  status: string;
  notes?: string | null;
  cancelledAt?: Date | null;
  cancelledBy?: string | null;
  isPriority: boolean;
  createdAt: Date;
  updatedAt: Date;
  babalawo?: User;
  client?: User;
}

export interface Payment {
  id: string;
  userId: string;
  transactionId: string;
  amount: number;
  currency: string;
  status: string;
  purpose: string;
  provider?: string | null;
  metadata?: any;
  verified: boolean;
  verifiedAt?: Date | null;
  verifiedBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
}
