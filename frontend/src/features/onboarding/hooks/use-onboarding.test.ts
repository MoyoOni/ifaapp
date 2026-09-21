import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOnboarding } from './use-onboarding';

const apiPatch = vi.fn();
vi.mock('@/lib/api', () => ({ default: { patch: (...a: unknown[]) => apiPatch(...a), get: vi.fn(), post: vi.fn() } }));

const navigate = vi.fn();
vi.mock('react-router-dom', () => ({ useNavigate: () => navigate }));

const showError = vi.fn();
vi.mock('@/shared/components/toast', () => ({ useToast: () => ({ error: showError, success: vi.fn() }) }));

vi.mock('@/shared/contexts/language-context', () => ({ useLanguage: () => ({ t: (k: string) => k }) }));
vi.mock('@/lib/analytics', () => ({ analytics: { track: vi.fn() } }));

const setUser = vi.fn();
vi.mock('@/shared/hooks/use-auth', () => ({
  useAuth: () => ({ user: { id: 'u1', role: 'VENDOR' }, setUser }),
}));

const PROGRESS_KEY = 'onboarding_progress_u1';

describe('useOnboarding.completeOnboarding', () => {
  beforeEach(() => {
    apiPatch.mockReset();
    navigate.mockReset();
    showError.mockReset();
    setUser.mockReset();
    localStorage.clear();
    localStorage.setItem(PROGRESS_KEY, JSON.stringify({ step: 'avatar', location: 'Lagos' }));
  });

  it('tells the user and keeps their saved progress when the server rejects the request', async () => {
    apiPatch.mockRejectedValue(new Error('403'));
    const { result } = renderHook(() => useOnboarding({ userId: 'u1', userRole: 'VENDOR' }));

    await act(async () => {
      await result.current.completeOnboarding();
    });

    // this used to fail silently -- "Skip for now" just appeared to do nothing
    expect(showError).toHaveBeenCalledWith(expect.stringMatching(/couldn't finish/i));
    expect(navigate).not.toHaveBeenCalled();
    expect(localStorage.getItem(PROGRESS_KEY)).not.toBeNull(); // not discarded before success
    expect(result.current.isSubmitting).toBe(false);
  });

  it('clears saved progress and moves on to the dashboard once the server accepts it', async () => {
    apiPatch.mockResolvedValue({ data: { id: 'u1', role: 'VENDOR', hasOnboarded: true } });
    const { result } = renderHook(() => useOnboarding({ userId: 'u1', userRole: 'VENDOR' }));

    await act(async () => {
      await result.current.completeOnboarding();
    });

    expect(apiPatch).toHaveBeenCalledWith(
      '/users/u1/onboarding',
      expect.objectContaining({ hasOnboarded: true })
    );
    expect(localStorage.getItem(PROGRESS_KEY)).toBeNull();
    expect(setUser).toHaveBeenCalledWith(expect.objectContaining({ hasOnboarded: true }));
    expect(navigate).toHaveBeenCalledWith(expect.stringContaining('/'), { replace: true });
    expect(showError).not.toHaveBeenCalled();
  });
});
