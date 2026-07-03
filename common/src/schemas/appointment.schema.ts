import { z } from 'zod';

/**
 * Appointment Schema
 * Booking system for Babalawo consultations
 * NOTE: Timezone defaults to WAT (West Africa Time)
 */
export const AppointmentSchema = z.object({
  id: z.string().uuid(),
  babalawoId: z.string().uuid(),
  clientId: z.string().uuid(),
  date: z.string(), // ISO date string
  time: z.string(), // Time string (HH:mm format)
  timezone: z.string().default('Africa/Lagos'), // WAT default
  duration: z.number().int().positive().default(60), // Minutes
  status: z.enum(['UPCOMING', 'COMPLETED', 'CANCELLED', 'IN_SESSION']),
  price: z.number().nonnegative().optional(),
  notes: z.string().optional(),
  cancelledAt: z.date().optional(),
  cancelledBy: z.string().uuid().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export type Appointment = z.infer<typeof AppointmentSchema>;

/**
 * Create Appointment DTO Schema
 */
export const CreateAppointmentSchema = AppointmentSchema.omit({
  id: true,
  clientId: true,
  status: true,
  cancelledAt: true,
  cancelledBy: true,
  createdAt: true,
  updatedAt: true
});

export type CreateAppointmentDto = z.infer<typeof CreateAppointmentSchema>;

/**
 * Update Appointment DTO Schema
 */
export const UpdateAppointmentSchema = AppointmentSchema.partial().omit({
  id: true,
  babalawoId: true,
  clientId: true,
  createdAt: true
});

export type UpdateAppointmentDto = z.infer<typeof UpdateAppointmentSchema>;
