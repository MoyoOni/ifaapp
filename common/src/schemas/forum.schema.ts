import { z } from 'zod';
import { ThreadStatus, PostStatus } from '../enums/forum.enum.js';

/**
 * Forum Category Schema
 */
export const ForumCategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  icon: z.string().optional(),
  order: z.number().int().default(0),
  isActive: z.boolean().default(true),
  isTeachings: z.boolean().default(false),
  threadCount: z.number().int().default(0),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ForumCategory = z.infer<typeof ForumCategorySchema>;

/**
 * Forum Thread Schema
 */
export const ForumThreadSchema = z.object({
  id: z.string().uuid(),
  categoryId: z.string().uuid(),
  authorId: z.string().uuid(),
  title: z.string().min(1),
  content: z.string().min(1),
  status: z.nativeEnum(ThreadStatus).default(ThreadStatus.ACTIVE),
  isPinned: z.boolean().default(false),
  isLocked: z.boolean().default(false),
  isApproved: z.boolean().default(true),
  viewCount: z.number().int().default(0),
  postCount: z.number().int().default(0),
  lastPostAt: z.date().optional(),
  lastPostBy: z.string().uuid().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ForumThread = z.infer<typeof ForumThreadSchema>;

/**
 * Forum Post Schema
 */
export const ForumPostSchema = z.object({
  id: z.string().uuid(),
  threadId: z.string().uuid(),
  authorId: z.string().uuid(),
  content: z.string().min(1),
  status: z.nativeEnum(PostStatus).default(PostStatus.ACTIVE),
  isEdited: z.boolean().default(false),
  editedAt: z.date().optional(),
  acknowledgeCount: z.number().int().default(0),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ForumPost = z.infer<typeof ForumPostSchema>;
