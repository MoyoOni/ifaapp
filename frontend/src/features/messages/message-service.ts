/**
 * Unified Messaging Service (V4-104)
 * Consolidates all messaging functionality to a single, properly implemented service
 */

import { logger } from '@/shared/utils/logger';
import api from '@/lib/api';

// Define message types
export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  read: boolean;
  createdAt: string;
  readAt?: string;
  attachments?: any[];
  sender: {
    id: string;
    name: string;
    yorubaName?: string;
    avatar?: string;
  };
  receiver: {
    id: string;
    name: string;
    yorubaName?: string;
    avatar?: string;
  };
}

export interface Conversation {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  read: boolean;
  createdAt: string;
  sender: any;
  receiver: any;
  otherUser: any;
  unreadCount: number;
}

// Real API-based message sending
export const sendMessage = async (
  userId: string,
  otherUserId: string,
  content: string,
  attachments: any[] = [],
  confidential = false,
  privacyLevel = 'PRIVATE',
  autoDeleteDays: number | null = null
): Promise<Message> => {
  const response = await api.post(`/messaging/send/${userId}`, {
    receiverId: otherUserId,
    content,
    attachments,
    confidential,
    privacyLevel,
    autoDeleteDays: autoDeleteDays || undefined,
  });
  return response.data;
};

// Real API-based conversation fetching
export const getConversation = async (userId: string, otherUserId: string): Promise<Message[]> => {
  const response = await api.get(`/messaging/conversation/${userId}/${otherUserId}`);
  return response.data ?? [];
};

// Real API-based inbox fetching
export const getInbox = async (userId: string): Promise<Conversation[]> => {
  const response = await api.get(`/messaging/inbox/${userId}`);
  return response.data ?? [];
};

// Mark conversation as read
export const markAsRead = async (userId: string, otherUserId: string): Promise<void> => {
  try {
    await api.patch(`/messaging/conversation/${otherUserId}/${userId}/read`);
  } catch (error) {
    logger.warn('Mark as read failed', error);
  }
};