import type { ClientDashboardSummary } from './dashboard/types';

export type DashboardState =
  | 'new_user'
  | 'has_upcoming'
  | 'active_guidance_plan'
  | 'guidance_plan_completed'
  | 'rebook'
  | 'inactive'
  | 'default';

export interface DashboardCta {
  state: DashboardState;
  headline: string;
  sub: string;
  action: string;
  route: string;
  babalawoId?: string;
  babalawoName?: string;
  planId?: string;
}

export function deriveDashboardState(
  dashboard: ClientDashboardSummary | undefined,
  userCreatedAt: string | undefined,
): DashboardCta {
  if (!dashboard) {
    return { state: 'default', headline: 'Welcome', sub: '', action: 'Explore', route: '/discovery' };
  }

  const { recentConsultations, pendingGuidancePlans } = dashboard;
  const now = Date.now();

  // Has an upcoming appointment
  const upcoming = recentConsultations.find(
    (c) => (c.status === 'CONFIRMED' || c.status === 'PENDING_CONFIRMATION') &&
      new Date(c.scheduledDate).getTime() > now,
  );
  if (upcoming) {
    const daysUntil = Math.ceil(
      (new Date(upcoming.scheduledDate).getTime() - now) / (1000 * 60 * 60 * 24),
    );
    const when = daysUntil === 0 ? 'today' : daysUntil === 1 ? 'tomorrow' : `in ${daysUntil} days`;
    return {
      state: 'has_upcoming',
      headline: `Your next session is ${when}`,
      sub: `with ${upcoming.babalawoName}`,
      action: 'View Details',
      route: '/client/consultations',
      babalawoId: upcoming.babalawoId,
      babalawoName: upcoming.babalawoName,
    };
  }

  // Active guidance plan in progress
  const activePlan = pendingGuidancePlans.find((p) => p.status === 'IN_PROGRESS' || p.status === 'APPROVED');
  if (activePlan) {
    return {
      state: 'active_guidance_plan',
      headline: 'You have an active guidance plan',
      sub: activePlan.title,
      action: 'Check Progress',
      route: '/guidance-plans',
      planId: activePlan.id,
    };
  }

  // Guidance plan awaiting approval / completed
  const completedPlan = pendingGuidancePlans.find((p) => p.status === 'COMPLETED');
  if (completedPlan) {
    return {
      state: 'guidance_plan_completed',
      headline: 'Well done — guidance plan complete',
      sub: 'Ready for a follow-up reading?',
      action: 'Book a Follow-up',
      route: '/discovery',
    };
  }

  const completed = recentConsultations.filter((c) => c.status === 'COMPLETED');

  // Never booked
  if (completed.length === 0) {
    const daysSinceJoin = userCreatedAt
      ? Math.floor((now - new Date(userCreatedAt).getTime()) / (1000 * 60 * 60 * 24))
      : 0;
    if (daysSinceJoin < 30) {
      return {
        state: 'new_user',
        headline: 'Begin your spiritual journey',
        sub: 'Book your first consultation with a Babalawo',
        action: 'Find a Babalawo',
        route: '/discovery',
      };
    }
  }

  // Has past sessions — offer rebook
  if (completed.length > 0) {
    const last = completed[0];
    const weeksSince = Math.floor(
      (now - new Date(last.scheduledDate).getTime()) / (1000 * 60 * 60 * 24 * 7),
    );
    if (weeksSince >= 3) {
      return {
        state: 'rebook',
        headline: `It's been ${weeksSince} weeks since your last session`,
        sub: `Ready to reconnect with ${last.babalawoName}?`,
        action: 'Book Again',
        route: `/booking/${last.babalawoId}`,
        babalawoId: last.babalawoId,
        babalawoName: last.babalawoName,
      };
    }
  }

  // Inactive 30+ days (has account but nothing recent)
  const daysSinceJoin = userCreatedAt
    ? Math.floor((now - new Date(userCreatedAt).getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  if (daysSinceJoin > 30 && completed.length === 0) {
    return {
      state: 'inactive',
      headline: 'Reconnect with your practice',
      sub: 'Your spiritual journey awaits',
      action: 'Browse Practitioners',
      route: '/discovery',
    };
  }

  return {
    state: 'default',
    headline: 'Continue your journey',
    sub: 'Explore what the sanctuary has to offer',
    action: 'Explore',
    route: '/discovery',
  };
}
