/**
 * useProfileCompleteness - React hook for profile completion tracking
 */

import { useMemo, useCallback } from 'react';
import { profileCompletenessService, type CompletionScore, type MissingItem } from '../services/profileCompletenessService';
import { UserRole } from '@common';

interface UseProfileCompletenessOptions {
  userData: any;
  userRole: UserRole;
}

/**
 * Hook for getting profile completeness score with utilities
 */
export const useProfileCompleteness = ({
  userData,
  userRole,
}: UseProfileCompletenessOptions) => {
  // Calculate score (memoized to avoid recalculation)
  const score: CompletionScore = useMemo(
    () => profileCompletenessService.calculateScore(userData, userRole),
    [userData, userRole],
  );

  // Get next priority item
  const nextPriority = useMemo(() => {
    return score.missingItems[0] || null;
  }, [score.missingItems]);

  // Get items by section
  const itemsBySection = useMemo(() => {
    const grouped: Record<string, MissingItem[]> = {};

    score.missingItems.forEach(item => {
      if (!grouped[item.section]) {
        grouped[item.section] = [];
      }
      grouped[item.section].push(item);
    });

    return grouped;
  }, [score.missingItems]);

  // Check if specific field is complete
  const isFieldComplete = useCallback(
    (field: string) => score.completedItems.includes(field),
    [score.completedItems],
  );

  // Get completion percentage for specific section
  const getSectionCompletion = useCallback(
    (section: string) => {
      const items = Object.values(itemsBySection).flat();
      const sectionItems = items.filter(item => item.section === section);
      if (sectionItems.length === 0) return 100;

      const completed = score.completedItems.length;
      return Math.round((completed / sectionItems.length) * 100);
    },
    [itemsBySection, score.completedItems],
  );

  // Check if user should see completion nudge
  const shouldShowNudge = useCallback(() => {
    // Show if incomplete and not recently dismissed
    const lastDismiss = localStorage.getItem(`completeness-nudge-dismiss-${userData?.id}`);
    if (lastDismiss) {
      const daysSinceDismiss = (Date.now() - parseInt(lastDismiss)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismiss < 7) {
        return false;
      }
    }
    return score.tier !== 'complete';
  }, [userData?.id, score.tier]);

  // Dismiss nudge for 7 days
  const dismissNudge = useCallback(() => {
    localStorage.setItem(`completeness-nudge-dismiss-${userData?.id}`, Date.now().toString());
  }, [userData?.id]);

  // Reset completeness (for testing)
  const resetCompletenessTracking = useCallback(() => {
    localStorage.removeItem(`completeness-nudge-dismiss-${userData?.id}`);
  }, [userData?.id]);

  return {
    score,
    nextPriority,
    itemsBySection,
    isFieldComplete,
    getSectionCompletion,
    shouldShowNudge,
    dismissNudge,
    resetCompletenessTracking,
    isComplete: score.tier === 'complete',
    isPartial: score.tier === 'partial',
    isIncomplete: score.tier === 'incomplete',
  };
};

/**
 * Hook for tracking completeness changes
 */
export const useCompletionProgress = (userRole: UserRole) => {
  // Get stored progress from localStorage
  const getStoredProgress = useCallback(() => {
    const stored = localStorage.getItem(`completion-progress-${userRole}`);
    return stored ? JSON.parse(stored) : { started: Date.now(), milestones: [] };
  }, [userRole]);

  // Record milestone
  const recordMilestone = useCallback(
    (field: string, score: number) => {
      const progress = getStoredProgress();
      progress.milestones.push({
        field,
        score,
        timestamp: Date.now(),
      });
      localStorage.setItem(`completion-progress-${userRole}`, JSON.stringify(progress));
    },
    [userRole, getStoredProgress],
  );

  // Get time to completion estimate
  const getTimeToCompletion = useCallback(() => {
    const progress = getStoredProgress();
    const milestonesPerDay = progress.milestones.length / ((Date.now() - progress.started) / (1000 * 60 * 60 * 24));
    const remainingItems = 7 - progress.milestones.length;
    const daysToComplete = remainingItems / milestonesPerDay;

    return {
      milestonesCompleted: progress.milestones.length,
      estimatedDaysRemaining: Math.ceil(daysToComplete),
      completionRate: Math.round(milestonesPerDay),
    };
  }, [getStoredProgress]);

  return {
    getStoredProgress,
    recordMilestone,
    getTimeToCompletion,
  };
};
