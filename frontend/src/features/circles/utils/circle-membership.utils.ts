import { logger } from '@/shared/utils/logger';

export interface SessionMembership {
  status: string;
  role: string;
}

/**
 * Store circle membership in sessionStorage (for demo fallback)
 */
export const setSessionMembership = (circleId: string, isJoining: boolean, role?: string) => {
  if (typeof sessionStorage === 'undefined') {
    return;
  }
  const key = `demo-circle-membership:${circleId}`;
  if (isJoining) {
    sessionStorage.setItem(
      key,
      JSON.stringify({
        status: 'ACTIVE',
        role: role || 'MEMBER',
      })
    );
  } else {
    sessionStorage.removeItem(key);
  }
};

/**
 * Retrieve circle membership from sessionStorage
 */
export const getSessionMembership = (circleId: string): SessionMembership | null => {
  if (typeof sessionStorage === 'undefined') {
    return null;
  }
  const cached = sessionStorage.getItem(`demo-circle-membership:${circleId}`);
  if (!cached) {
    return null;
  }
  try {
    return JSON.parse(cached) as SessionMembership;
  } catch (error) {
    logger.warn('Failed to parse circle membership cache', error);
    return null;
  }
};
