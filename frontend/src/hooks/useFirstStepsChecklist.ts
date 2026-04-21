/**
 * useFirstStepsChecklist - React hook for first steps checklist
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { firstStepsChecklistService, type ChecklistState } from '../services/firstStepsChecklistService';

interface UseFirstStepsChecklistOptions {
  userId: string;
  userRole: 'CLIENT' | 'BABALAWO' | 'VENDOR';
}

export const useFirstStepsChecklist = ({ userId, userRole }: UseFirstStepsChecklistOptions) => {
  const [checklist, setChecklist] = useState<ChecklistState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize checklist on mount
  useEffect(() => {
    const initial = firstStepsChecklistService.getChecklist(userId, userRole);
    setChecklist(initial);
    setIsLoading(false);
  }, [userId, userRole]);

  // Mark item complete
  const completeItem = useCallback(
    (itemId: string) => {
      const updated = firstStepsChecklistService.completeItem(userId, itemId);
      if (updated) {
        setChecklist(updated);
      }
    },
    [userId],
  );

  // Mark item incomplete (for testing)
  const uncompleteItem = useCallback(
    (itemId: string) => {
      const updated = firstStepsChecklistService.uncompleteItem(userId, itemId);
      if (updated) {
        setChecklist(updated);
      }
    },
    [userId],
  );

  // Dismiss checklist
  const dismiss = useCallback(() => {
    const updated = firstStepsChecklistService.dismissChecklist(userId);
    if (updated) {
      setChecklist(updated);
    }
  }, [userId]);

  // Get progress percentage
  const progress = useMemo(() => {
    return checklist ? firstStepsChecklistService.getProgress(userId) : 0;
  }, [checklist, userId]);

  // Get items by section
  const itemsBySection = useMemo(() => {
    return firstStepsChecklistService.getItemsBySection(userId, userRole);
  }, [userId, userRole]);

  // Get next recommended item
  const nextItem = useMemo(() => {
    return firstStepsChecklistService.getNextItem(userId, userRole);
  }, [userId, userRole]);

  // Check if should show
  const shouldShow = useMemo(() => {
    return firstStepsChecklistService.shouldShowChecklist(userId);
  }, [userId]);

  // Check if complete
  const isComplete = useMemo(() => {
    return checklist ? checklist.completedCount === checklist.items.length : false;
  }, [checklist]);

  return {
    checklist,
    isLoading,
    progress,
    itemsBySection,
    nextItem,
    shouldShow,
    isComplete,
    completeItem,
    uncompleteItem,
    dismiss,
  };
};
