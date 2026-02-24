import { z } from 'zod';

/**
 * Babalawo-Client Relationship Schema
 * "Personal Awo" relationship model (one-to-many, client can change)
 * NOTE: Not "unfriend" - culturally respectful relationship management
 */
export const BabalawoClientSchema = z.object({
  id: z.string().uuid(),
  babalawoId: z.string().uuid(),
  clientId: z.string().uuid(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'CHANGED']), // Changed = client selected different Awo
  assignedAt: z.date(),
  changedAt: z.date().optional(), // When client changed to different Awo
  notes: z.string().optional() // Private notes from Babalawo
});

export type BabalawoClient = z.infer<typeof BabalawoClientSchema>;

/**
 * Create Babalawo-Client Relationship DTO Schema
 */
export const CreateBabalawoClientSchema = BabalawoClientSchema.omit({
  id: true,
  status: true,
  assignedAt: true,
  changedAt: true
});

export type CreateBabalawoClientDto = z.infer<typeof CreateBabalawoClientSchema>;
