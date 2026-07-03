import { z } from 'zod';

/**
 * Message Attachment Schema
 * Supports documents, audio (chants/recordings), and video
 */
export const MessageAttachmentSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['document', 'audio', 'video', 'image']),
  url: z.string(), // Signed URL for secure access
  filename: z.string(),
  size: z.number().int().positive(), // Size in bytes
  mimeType: z.string(),
  s3Key: z.string() // Private S3 key
});

export type MessageAttachment = z.infer<typeof MessageAttachmentSchema>;

/**
 * Message Schema
 * Encrypted content for Babalawo-client communication
 * NOTE: Content is end-to-end encrypted before storage
 */
export const MessageSchema = z.object({
  id: z.string().uuid(),
  senderId: z.string().uuid(),
  receiverId: z.string().uuid(),
  content: z.string(), // Encrypted text content
  encrypted: z.boolean().default(true),
  read: z.boolean().default(false),
  attachments: z.array(MessageAttachmentSchema).optional(),
  createdAt: z.date(),
  readAt: z.date().optional()
});

export type Message = z.infer<typeof MessageSchema>;

/**
 * Create Message DTO Schema
 */
export const CreateMessageSchema = MessageSchema.omit({
  id: true,
  encrypted: true,
  read: true,
  createdAt: true,
  readAt: true
}).extend({
  content: z.string().min(1).max(10000) // Plain text, will be encrypted server-side
});

export type CreateMessageDto = z.infer<typeof CreateMessageSchema>;
