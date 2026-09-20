import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { SidebarLayout } from './sidebar-layout';
import { LanguageProvider } from '@/shared/contexts/language-context';

const renderLayout = () =>
  render(
    <LanguageProvider>
      <SidebarLayout><div>page</div></SidebarLayout>
    </LanguageProvider>
  );

const useAuthMock = vi.fn();
vi.mock('@/shared/hooks/use-auth', () => ({
  useAuth: () => useAuthMock(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/lib/api', () => ({ default: { get: vi.fn().mockResolvedValue({ data: [] }) } }));

describe('SidebarLayout for a logged-out visitor', () => {
  beforeEach(() => {
    useAuthMock.mockReset();
    useAuthMock.mockReturnValue({ user: null, isAuthenticated: false, logout: vi.fn() });
  });

  it('does not show a fake "User / Member" identity or account-only navigation', () => {
    renderLayout();

    expect(screen.queryByText('MEMBER')).not.toBeInTheDocument();
    expect(screen.queryByText('Member')).not.toBeInTheDocument();
    expect(screen.queryByText('Wallet')).not.toBeInTheDocument();
    expect(screen.queryByText('My Profile')).not.toBeInTheDocument();
    expect(screen.queryByText('Member Directory')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Notifications' })).not.toBeInTheDocument();
  });

  it('offers sign in / get started instead, and still lists the public pages', () => {
    renderLayout();

    expect(screen.getAllByText('Get Started').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Sign In').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Temples').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Academy').length).toBeGreaterThan(0);
  });
});

describe('SidebarLayout for a logged-in user', () => {
  it('still shows their identity, wallet and notifications', () => {
    useAuthMock.mockReset();
    useAuthMock.mockReturnValue({
      user: { id: 'u1', name: 'Ada Test', role: 'CLIENT', hasOnboarded: true },
      isAuthenticated: true,
      logout: vi.fn(),
    });
    renderLayout();

    expect(screen.getAllByText('Ada Test').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Wallet').length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: 'Notifications' }).length).toBeGreaterThan(0);
  });
});
