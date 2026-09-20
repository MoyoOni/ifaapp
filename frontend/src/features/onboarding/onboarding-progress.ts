import { UserRole } from '@common';
import type { OnboardingStep } from './hooks/use-onboarding';

/**
 * The questionnaire steps a given role actually sees, in order (the welcome
 * slides before them aren't counted). Mirrors the transitions wired in
 * onboarding-view.tsx: role-setup is Babalawo/Vendor only, username and
 * credentials are Babalawo only, and discover-temples is Client only.
 */
export function getOnboardingSteps(role: UserRole | undefined): OnboardingStep[] {
  const start: OnboardingStep[] = ['intent', 'preferences'];
  const end: OnboardingStep[] = ['form', 'avatar'];
  switch (role) {
    case UserRole.CLIENT:
      return [...start, 'heritage', 'discover-temples', ...end];
    case UserRole.VENDOR:
      return [...start, 'role-setup', 'heritage', ...end];
    case UserRole.BABALAWO:
      return [...start, 'role-setup', 'username', 'credentials', 'heritage', ...end];
    default:
      return [...start, 'heritage', ...end];
  }
}

export function getOnboardingProgress(
  role: UserRole | undefined,
  step: OnboardingStep
): { current: number; total: number; percent: number } | null {
  const steps = getOnboardingSteps(role);
  const index = steps.indexOf(step);
  if (index === -1) return null;
  const current = index + 1;
  return { current, total: steps.length, percent: Math.round((current / steps.length) * 100) };
}
