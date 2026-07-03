import { z } from 'zod';

/**
 * Document Schema
 * Secure document portal for Babalawo-client file exchange
 * NOTE: Access control enforced - only assigned client can view
 */
export const DocumentSchema = z.object({
  id: z.string().uuid(),
  uploadedBy: z.string().uuid(), // Babalawo ID
  sharedWith: z.string().uuid(), // Client ID (access control)
  type: z.enum(['document', 'audio', 'video', 'image']),
  filename: z.string().min(1),
  originalFilename: z.string(),
  size: z.number().int().positive(),
  mimeType: z.string(),
  s3Key: z.string(), // Private S3 key
  signedUrl: z.string().url().optional(), // Temporary signed URL (expires)
  urlExpiresAt: z.date().optional(),
  description: z.string().optional(),
  scanned: z.boolean().default(false), // Virus scan status
  encrypted: z.boolean().default(true), // Encryption at rest
  createdAt: z.date()
});

export type Document = z.infer<typeof DocumentSchema>;

/**
 * Create Document DTO Schema
 */
export const CreateDocumentSchema = DocumentSchema.omit({
  id: true,
  uploadedBy: true,
  s3Key: true,
  signedUrl: true,
  urlExpiresAt: true,
  scanned: true,
  encrypted: true,
  createdAt: true
});

export type CreateDocumentDto = z.infer<typeof CreateDocumentSchema>;
