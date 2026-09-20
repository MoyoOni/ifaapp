import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { Routes, Route } from 'react-router-dom';
import { RequireAuth } from './protected-route';

const useAuthMock = vi.fn();
vi.mock('@/shared/hooks/use-auth', () => ({
  useAuth: () => useAuthMock(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const tree = (
  <Routes>
    <Route path="/login" element={<div>login page</div>} />
    <Route path="/" element={<RequireAuth><div>secret wallet</div></RequireAuth>} />
  </Routes>
);

describe('RequireAuth', () => {
  beforeEach(() => {
    useAuthMock.mockReset();
    window.history.pushState({}, '', '/');
  });

  it('sends an anonymous visitor to /login instead of rendering the page', () => {
    useAuthMock.mockReturnValue({ user: null, isLoading: false });
    render(tree);
    expect(screen.getByText('login page')).toBeInTheDocument();
    expect(screen.queryByText('secret wallet')).not.toBeInTheDocument();
  });

  it('renders the page for any logged-in user', () => {
    useAuthMock.mockReturnValue({ user: { id: 'u1', role: 'VENDOR' }, isLoading: false });
    render(tree);
    expect(screen.getByText('secret wallet')).toBeInTheDocument();
  });

  it('does not redirect while auth is still resolving', () => {
    useAuthMock.mockReturnValue({ user: null, isLoading: true });
    render(tree);
    expect(screen.queryByText('login page')).not.toBeInTheDocument();
    expect(screen.queryByText('secret wallet')).not.toBeInTheDocument();
  });
});
