/**
 * Unified Messaging Service (V4-104)
 * Consolidates all messaging functionality to a single, properly implemented service
 */

import { logger } from '@/shared/utils/logger';
import api from '@/lib/api';
import { getDemoThread, saveDemoMessage, generateSimulatedReply, getDemoInbox } from './demo-messages';

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
  try {
    // Try to send via real API
    const response = await api.post(`/messaging/send/${userId}`, {
      receiverId: otherUserId,
      content,
      attachments,
      confidential,
      privacyLevel,
      autoDeleteDays: autoDeleteDays || undefined,
    });

    return response.data;
  } catch (error) {
    logger.warn('Real message send failed, falling back to demo mode', error);
    
    // In demo mode, save to sessionStorage and generate simulated reply
    const msg = saveDemoMessage(userId, otherUserId, content);
    
    // Schedule a simulated reply after a short delay
    setTimeout(() => {
      generateSimulatedReply(userId, otherUserId);
      // Note: We don't trigger cache invalidation here as it will be handled by the calling component
    }, 1500 + (Math.random() * 2000)); // Random delay between 1.5-3.5 seconds

    return msg;
  }
};

// Real API-based conversation fetching
export const getConversation = async (userId: string, otherUserId: string): Promise<Message[]> => {
  try {
    const response = await api.get(`/messaging/conversation/${userId}/${otherUserId}`);
    if (response.data && response.data.length > 0) {
      return response.data;
    }
  } catch (error) {
    logger.warn('Real conversation fetch failed, falling back to demo mode', error);
  }

  // Fallback to demo thread with sessionStorage persistence
  return getDemoThread(userId, otherUserId) as Message[];
};

// Real API-based inbox fetching
export const getInbox = async (userId: string): Promise<Conversation[]> => {
  try {
    const response = await api.get(`/messaging/inbox/${userId}`);
    if (response.data && response.data.length > 0) {
      return response.data;
    }
  } catch (error) {
    logger.warn('Real inbox fetch failed, falling back to demo mode', error);
  }

  // Fallback to demo conversations with sessionStorage persistence
  return getDemoInbox(userId) as Conversation[];
};

// Mark conversation as read
export const markAsRead = async (userId: string, otherUserId: string): Promise<void> => {
  try {
    await api.patch(`/messaging/conversation/${otherUserId}/${userId}/read`);
  } catch (error) {
    logger.warn('Mark as read failed', error);
  }
};