import { z } from 'zod';

// Schema for consent preferences
export const ConsentPreferencesSchema = z.object({
  marketingEmails: z.boolean().optional(),
  dataProcessing: z.boolean().optional(),
  forumDigest: z.boolean().optional(),
});

// Type for consent preferences
export type ConsentPreferences = z.infer<typeof ConsentPreferencesSchema>;

// Schema for user data export response
export const UserDataExportSchema = z.object({
  user: z.any(), // Detailed user object
  appointmentsAsBabalawo: z.array(z.any()), // Appointments where user is babalawo
  appointmentsAsClient: z.array(z.any()), // Appointments where user is client
  certificates: z.array(z.any()), // User certificates
  reviews: z.array(z.any()), // Reviews given by user
  receivedReviews: z.array(z.any()), // Reviews received by user
  messagesSent: z.array(z.any()), // Messages sent by user
  messagesReceived: z.array(z.any()), // Messages received by user
  wallet: z.any().nullable(), // User wallet if exists
  transactions: z.array(z.any()), // Transaction history
  notifications: z.array(z.any()), // Notification history
  forumThreads: z.array(z.any()), // Forum threads created by user
  forumPosts: z.array(z.any()), // Forum posts created by user
  subscriptions: z.array(z.any()), // Subscription history
  payments: z.array(z.any()), // Payment history
});

// Type for user data export
export type UserDataExport = z.infer<typeof UserDataExportSchema>;