import { describe, it, expect } from 'vitest';
import { UserRole } from '@common';
import { getOnboardingProgress, getOnboardingSteps } from './onboarding-progress';

describe('onboarding progress', () => {
  it('numbers a Client 1..6 with no gap (role-setup is never shown to them)', () => {
    const steps = getOnboardingSteps(UserRole.CLIENT);
    expect(steps).toEqual(['intent', 'preferences', 'heritage', 'discover-temples', 'form', 'avatar']);
    const numbers = steps.map((s) => getOnboardingProgress(UserRole.CLIENT, s)!.current);
    expect(numbers).toEqual([1, 2, 3, 4, 5, 6]);
    expect(getOnboardingProgress(UserRole.CLIENT, 'avatar')).toEqual({ current: 6, total: 6, percent: 100 });
  });

  it('never goes backwards for a Babalawo, whose username/credentials steps come before heritage', () => {
    const steps = getOnboardingSteps(UserRole.BABALAWO);
    const numbers = steps.map((s) => getOnboardingProgress(UserRole.BABALAWO, s)!.current);
    expect(numbers).toEqual([...numbers].sort((a, b) => a - b));
    expect(new Set(numbers).size).toBe(numbers.length);
    expect(steps.indexOf('credentials')).toBeLessThan(steps.indexOf('heritage'));
  });

  it('skips discover-temples for a Vendor (Client-only step) and includes role-setup', () => {
    const steps = getOnboardingSteps(UserRole.VENDOR);
    expect(steps).not.toContain('discover-temples');
    expect(steps).toContain('role-setup');
  });

  it('returns null for a step the role never sees, so the header hides instead of lying', () => {
    expect(getOnboardingProgress(UserRole.CLIENT, 'role-setup')).toBeNull();
    expect(getOnboardingProgress(UserRole.CLIENT, 'welcome')).toBeNull();
  });
});
