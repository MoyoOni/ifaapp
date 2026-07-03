import { useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from './use-auth';
import { logger } from '@/shared/utils/logger';
import {
  isOnline,
  onOnlineStatusChange,
  getRetryableActions,
  removeQueuedAction,
  incrementRetry,
} from '../utils/offline-queue';

/**
 * Hook for syncing offline queued actions
 */
export function useOfflineSync() {
  const { user } = useAuth();
  
  const syncMutation = useMutation({
    mutationFn: async (action: any) => {
      const { endpoint, method, payload } = action;
      
      let response;
      if (method === 'POST') {
        response = await api.post(endpoint, payload);
      } else if (method === 'PATCH') {
        response = await api.patch(endpoint, payload);
      } else if (method === 'DELETE') {
        response = await api.delete(endpoint);
      } else {
        throw new Error(`Unsupported method: ${method}`);
      }

      return response.data;
    },
    onSuccess: (_, action) => {
      // Remove from queue on success
      removeQueuedAction(action.id);
    },
    onError: (error, action) => {
      // Increment retry count
      incrementRetry(action.id);
      
      // If max retries reached, remove from queue
      if (action.retries >= 3) {
        logger.error(`Failed to sync action ${action.id} after 3 retries:`, error);
        removeQueuedAction(action.id);
      }
    },
  });

  useEffect(() => {
    const syncQueuedActions = async () => {
      if (!isOnline() || !user?.id) {
        return;
      }

      const actions = getRetryableActions();
      if (actions.length === 0) {
        return;
      }

      // Try bulk sync first (more efficient)
      try {
        const response = await api.post(`/wallet/${user.id}/sync`, { actions });
        // Remove successfully synced actions
        response.data.results.forEach((result: any) => {
          if (result.success) {
            removeQueuedAction(result.actionId);
          }
        });
      } catch (error) {
        // Fallback to individual sync
        for (const action of actions) {
          try {
            await syncMutation.mutateAsync(action);
          } catch (err) {
            logger.error(`Failed to sync action ${action.id}:`, err);
            // Continue with next action
          }
        }
      }
    };

    // Sync immediately if online
    if (isOnline()) {
      syncQueuedActions();
    }

    // Listen for online events and sync
    const unsubscribe = onOnlineStatusChange((online) => {
      if (online) {
        syncQueuedActions();
      }
    });

    // Also sync periodically when online
    const interval = setInterval(() => {
      if (isOnline()) {
        syncQueuedActions();
      }
    }, 30000); // Every 30 seconds

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [syncMutation]);

  return { syncMutation };
}
