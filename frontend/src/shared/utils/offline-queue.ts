/**
 * Offline Queue Utility
 * Manages queued actions when offline, syncs when online
 */
import { logger } from '@/shared/utils/logger';

export interface QueuedAction {
  id: string;
  type: 'message' | 'appointment' | 'document' | 'post' | 'acknowledgment';
  endpoint: string;
  method: 'POST' | 'PATCH' | 'DELETE';
  payload: any;
  timestamp: number;
  retries: number;
}

const QUEUE_KEY = 'ile-ase-offline-queue';
const MAX_RETRIES = 3;

/**
 * Add action to offline queue
 */
export function queueAction(action: Omit<QueuedAction, 'id' | 'timestamp' | 'retries'>): string {
  const queue = getQueue();
  const id = `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const queuedAction: QueuedAction = {
    id,
    ...action,
    timestamp: Date.now(),
    retries: 0,
  };

  queue.push(queuedAction);
  saveQueue(queue);
  
  return id;
}

/**
 * Get all queued actions
 */
export function getQueue(): QueuedAction[] {
  try {
    const stored = localStorage.getItem(QUEUE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    logger.error('Failed to get offline queue:', error);
    return [];
  }
}

/**
 * Save queue to localStorage
 */
function saveQueue(queue: QueuedAction[]): void {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    logger.error('Failed to save offline queue:', error);
  }
}

/**
 * Remove action from queue
 */
export function removeQueuedAction(id: string): void {
  const queue = getQueue();
  const filtered = queue.filter((action) => action.id !== id);
  saveQueue(filtered);
}

/**
 * Increment retry count for an action
 */
export function incrementRetry(id: string): void {
  const queue = getQueue();
  const action = queue.find((a) => a.id === id);
  if (action) {
    action.retries += 1;
    saveQueue(queue);
  }
}

/**
 * Get actions that should be retried
 */
export function getRetryableActions(): QueuedAction[] {
  return getQueue().filter((action) => action.retries < MAX_RETRIES);
}

/**
 * Clear all queued actions
 */
export function clearQueue(): void {
  localStorage.removeItem(QUEUE_KEY);
}

/**
 * Check if we're online
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Listen for online/offline events
 */
export function onOnlineStatusChange(callback: (isOnline: boolean) => void): () => void {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}
