import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOnboarding } from './use-onboarding';

const apiPatch = vi.fn();
const apiPut = vi.fn();
vi.mock('@/lib/api', () => ({ default: { patch: (...a: unknown[]) => apiPatch(...a), put: (...a: unknown[]) => apiPut(...a), get: vi.fn(), post: vi.fn() } }));

const navigate = vi.fn();
vi.mock('react-router-dom', () => ({ useNavigate: () => navigate }));

const showError = vi.fn();
vi.mock('@/shared/components/toast', () => ({ useToast: () => ({ error: showError, success: vi.fn() }) }));

vi.mock('@/shared/contexts/language-context', () => ({ useLanguage: () => ({ t: (k: string) => k }) }));
vi.mock('@/lib/analytics', () => ({ analytics: { track: vi.fn() } }));

const setUser = vi.fn();
let authUser: { id: string; role: string; avatar?: string } | null = { id: 'u1', role: 'VENDOR' };
vi.mock('@/shared/hooks/use-auth', () => ({
  useAuth: () => ({ user: authUser, setUser }),
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
    authUser = { id: 'u1', role: 'VENDOR' };
  });

  // This used to "simulate completion": navigate to the dashboard as if
  // onboarding had finished, with nothing saved.
  it('sends the user to sign in, rather than pretending, when the session is gone', async () => {
    authUser = null;
    const { result } = renderHook(() => useOnboarding({ userRole: 'VENDOR' }));

    await act(async () => {
      await result.current.completeOnboarding();
    });

    expect(apiPatch).not.toHaveBeenCalled();
    expect(showError).toHaveBeenCalledWith(expect.stringMatching(/sign in again/i));
    expect(navigate).toHaveBeenCalledWith('/login', { replace: true });
    expect(navigate).not.toHaveBeenCalledWith(expect.stringMatching(/dashboard/), expect.anything());
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

describe('useOnboarding.handleVendorRegister', () => {
  const apiPost = vi.fn();
  beforeEach(async () => {
    const api = (await import('@/lib/api')).default as unknown as { post: typeof apiPost };
    api.post = apiPost;
    apiPost.mockReset();
    showError.mockReset();
    authUser = { id: 'u1', role: 'VENDOR' };
  });

  const submit = async (result: { current: ReturnType<typeof useOnboarding> }) => {
    act(() => result.current.setVendorBusinessName('Ẹkùn Ifá Sacred Supplies'));
    await act(async () => {
      await result.current.handleVendorRegister({ preventDefault: () => {} } as React.FormEvent);
    });
  };

  // This used to log the failure and carry on to the next step anyway,
  // finishing onboarding with no shop and nowhere to create one.
  it('keeps the vendor on the shop step and says why when creating the shop fails', async () => {
    apiPost.mockRejectedValue({ response: { status: 500, data: { success: false, error: { userMessage: 'Something went wrong. Please try again.' } } } });
    const { result } = renderHook(() => useOnboarding({ userId: 'u1', userRole: 'VENDOR' }));
    const stepBefore = result.current.onboardingStep;

    await submit(result);

    expect(showError).toHaveBeenCalledWith(expect.stringMatching(/couldn't create your shop/i));
    expect(result.current.onboardingStep).toBe(stepBefore);
    expect(result.current.vendorSubmitting).toBe(false);
  });

  it('moves on when the shop is created', async () => {
    apiPost.mockResolvedValue({ data: { id: 'vendor-1' } });
    const { result } = renderHook(() => useOnboarding({ userId: 'u1', userRole: 'VENDOR' }));

    await submit(result);

    expect(showError).not.toHaveBeenCalled();
    expect(result.current.onboardingStep).toBe('heritage');
  });

  it('moves on when the shop already exists (409)', async () => {
    apiPost.mockRejectedValue({ response: { status: 409 } });
    const { result } = renderHook(() => useOnboarding({ userId: 'u1', userRole: 'VENDOR' }));

    await submit(result);

    expect(showError).not.toHaveBeenCalled();
    expect(result.current.onboardingStep).toBe('heritage');
  });
});

// "Add Your Photo" PATCHed the image data into User.avatar, which only accepts
// a URL, so every photo was rejected -- and it was sent twice.
describe('useOnboarding photo step', () => {
  const PHOTO = 'data:image/jpeg;base64,/9j/4AAQ';

  beforeEach(() => {
    apiPatch.mockReset().mockResolvedValue({ data: { id: 'u1', role: 'CLIENT', hasOnboarded: true } });
    apiPut.mockReset().mockResolvedValue({ data: { avatar: '/api/users/u1/avatar?v=1' } });
    showError.mockReset();
    navigate.mockReset();
    localStorage.clear();
    authUser = { id: 'u1', role: 'CLIENT' };
  });

  it('uploads a chosen photo once, to the photo endpoint, then finishes', async () => {
    const { result } = renderHook(() => useOnboarding({}));
    act(() => result.current.setAvatarPreview(PHOTO));
    await act(async () => { await result.current.handleAvatarUpload(); });

    expect(apiPut).toHaveBeenCalledTimes(1);
    expect(apiPut).toHaveBeenCalledWith('/users/u1/avatar', { image: PHOTO });
    expect(apiPatch).not.toHaveBeenCalledWith('/users/u1', expect.anything());
    expect(apiPatch).toHaveBeenCalledWith('/users/u1/onboarding', expect.objectContaining({ hasOnboarded: true }));
  });

  it('says so when the photo fails, and still finishes setting up', async () => {
    apiPut.mockRejectedValue(new Error('500'));
    const { result } = renderHook(() => useOnboarding({}));
    act(() => result.current.setAvatarPreview(PHOTO));
    await act(async () => { await result.current.handleAvatarUpload(); });

    expect(showError).toHaveBeenCalledWith(expect.stringMatching(/photo couldn't be saved/i));
    expect(apiPatch).toHaveBeenCalledWith('/users/u1/onboarding', expect.anything());
    expect(navigate).toHaveBeenCalledWith('/client/dashboard', { replace: true });
  });

  it('does not re-upload a pre-filled Google avatar', async () => {
    authUser = { id: 'u1', role: 'CLIENT', avatar: 'https://lh3.googleusercontent.com/a/x' };
    const { result } = renderHook(() => useOnboarding({}));
    await act(async () => { await result.current.handleAvatarUpload(); });

    expect(apiPut).not.toHaveBeenCalled();
    expect(apiPatch).toHaveBeenCalledWith('/users/u1/onboarding', expect.anything());
  });
});
