/**
 * User stats calculator (V4-103).
 * Derives spiritual growth and learning progress from actual dashboard data
 * instead of showing hardcoded values.
 */

import type { ClientDashboardSummary } from '@/shared/hooks/dashboard/types';

export interface UserStats {
  /** Spiritual growth level (1-5) based on platform engagement */
  level: number;
  /** Progress toward the next level as a percentage (0-100) */
  levelProgress: number;
  /** Tailwind width class for the progress bar */
  levelProgressClass: string;
  /** Learning progress percentage based on community and consultation activity */
  learningProgress: number;
}

/**
 * Maps a progress percentage (0-100) to the closest Tailwind width class.
 */
function toProgressClass(percent: number): string {
  if (percent <= 0) return 'w-0';
  if (percent <= 10) return 'w-1/12';
  if (percent <= 20) return 'w-1/5';
  if (percent <= 25) return 'w-1/4';
  if (percent <= 33) return 'w-1/3';
  if (percent <= 40) return 'w-2/5';
  if (percent <= 50) return 'w-1/2';
  if (percent <= 60) return 'w-3/5';
  if (percent <= 66) return 'w-2/3';
  if (percent <= 75) return 'w-3/4';
  if (percent <= 80) return 'w-4/5';
  if (percent <= 90) return 'w-11/12';
  return 'w-full';
}

/**
 * Calculates user stats from dashboard data.
 *
 * Scoring system:
 * - Each completed consultation: 2 points
 * - Each pending/active consultation: 1 point
 * - Each guidance plan: 2 points
 * - Each temple membership: 3 points
 * - Each circle membership: 2 points
 * - Having a wallet balance: 1 point
 *
 * Level thresholds: 0-2 = L1, 3-6 = L2, 7-12 = L3, 13-20 = L4, 21+ = L5
 */
export function calculateUserStats(dashboard: ClientDashboardSummary | undefined): UserStats {
  if (!dashboard) {
    return { level: 1, levelProgress: 0, levelProgressClass: 'w-0', learningProgress: 0 };
  }

  const completedConsultations = dashboard.recentConsultations.filter(
    (c) => c.status === 'COMPLETED',
  ).length;
  const activeConsultations = dashboard.recentConsultations.length - completedConsultations;
  const guidancePlans = dashboard.pendingGuidancePlans.length;
  const temples = dashboard.communities.temples.length;
  const circles = dashboard.communities.circles.length;
  const hasWallet = (dashboard.walletBalance?.amount ?? 0) > 0 ? 1 : 0;

  const totalPoints =
    completedConsultations * 2 +
    activeConsultations * 1 +
    guidancePlans * 2 +
    temples * 3 +
    circles * 2 +
    hasWallet;

  // Level thresholds
  const thresholds = [0, 3, 7, 13, 21]; // points needed for levels 1-5
  let level = 1;
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (totalPoints >= thresholds[i]) {
      level = i + 1;
      break;
    }
  }

  // Progress toward next level
  let levelProgress: number;
  if (level >= 5) {
    levelProgress = 100;
  } else {
    const currentThreshold = thresholds[level - 1];
    const nextThreshold = thresholds[level];
    const pointsInLevel = totalPoints - currentThreshold;
    const pointsNeeded = nextThreshold - currentThreshold;
    levelProgress = Math.round((pointsInLevel / pointsNeeded) * 100);
  }

  // Learning progress: ratio of engagement activities out of a reasonable target
  // Target: 2 consultations + 1 guidance plan + 1 temple + 1 circle = 5 activities
  const activityCount =
    dashboard.recentConsultations.length +
    guidancePlans +
    temples +
    circles;
  const learningProgress = Math.min(100, Math.round((activityCount / 5) * 100));

  return {
    level,
    levelProgress,
    levelProgressClass: toProgressClass(levelProgress),
    learningProgress,
  };
}
