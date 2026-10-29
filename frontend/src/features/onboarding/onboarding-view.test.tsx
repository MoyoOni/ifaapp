import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import OnboardingView from './onboarding-view';

vi.mock('@/lib/api', () => ({ default: { patch: vi.fn(), put: vi.fn(), get: vi.fn().mockResolvedValue({ data: [] }), post: vi.fn() } }));
vi.mock('@/shared/components/toast', () => ({ useToast: () => ({ error: vi.fn(), success: vi.fn() }) }));
vi.mock('@/shared/contexts/language-context', () => ({ useLanguage: () => ({ t: (k: string) => k }) }));
vi.mock('@/lib/analytics', () => ({ analytics: { track: vi.fn() } }));
vi.mock('@/shared/components/narrator-control', () => ({ default: () => null }));

let auth: { user: null | { id: string; name: string; role: string; hasOnboarded: boolean }; isAuthenticated: boolean; isLoading: boolean };
vi.mock('@/shared/hooks/use-auth', () => ({ useAuth: () => ({ ...auth, setUser: vi.fn() }) }));

const renderAt = () =>
  render(
    <MemoryRouter initialEntries={['/onboarding']}>
      <Routes>
        <Route path="/onboarding" element={<OnboardingView />} />
        <Route path="/login" element={<p>Login page</p>} />
        <Route path="/client/dashboard" element={<p>Client dashboard</p>} />
      </Routes>
    </MemoryRouter>
  );

describe('OnboardingView', () => {
  beforeEach(() => {
    localStorage.clear();
    auth = { user: { id: 'u1', name: 'Adé Test', role: 'CLIENT', hasOnboarded: false }, isAuthenticated: true, isLoading: false };
  });

  it('greets the member by name, not by role', () => {
    renderAt();
    expect(screen.getByRole('heading', { name: 'welcome, Adé' })).toBeInTheDocument();
  });

  // A visitor used to go all the way through and only be sent to sign in at
  // the end, losing everything they had entered.
  it('sends a visitor to sign in straight away', () => {
    auth = { user: null, isAuthenticated: false, isLoading: false };
    renderAt();
    expect(screen.getByText('Login page')).toBeInTheDocument();
  });

  // ...and an onboarded member could redo it and overwrite their profile.
  it('sends a member who has already onboarded to their dashboard', () => {
    auth.user!.hasOnboarded = true;
    renderAt();
    expect(screen.getByText('Client dashboard')).toBeInTheDocument();
  });

  // "Skip for now" went to the babalawo/vendor-only step: a blank page.
  it("moves a client on when they skip the first question", () => {
    localStorage.setItem('onboarding_progress_u1', JSON.stringify({ step: 'intent' }));
    renderAt();
    fireEvent.click(screen.getByRole('button', { name: 'Skip for now' }));
    expect(screen.getByRole('heading', { name: /reconnecting with your heritage/i })).toBeInTheDocument();
  });
});
