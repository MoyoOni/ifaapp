import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { isUnreachableError, setServerUnreachable } from './server-reachability';
import ServerUnreachableBanner from '@/shared/components/server-unreachable-banner';
import { RequireAuth } from '@/shared/components/protected-route';

let auth = { user: null as null | { id: string; role: string }, isLoading: false, isAuthenticated: true };
vi.mock('@/shared/hooks/use-auth', () => ({ useAuth: () => auth }));
vi.mock('../hooks/use-auth', () => ({ useAuth: () => auth }));

const wrap = (ui: React.ReactElement) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={['/wallet']}>
        <Routes>
          <Route path="/wallet" element={ui} />
          <Route path="/login" element={<p>Login page</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );

describe('isUnreachableError', () => {
  it('treats no response, and gateway errors, as unreachable', () => {
    expect(isUnreachableError({ request: {}, code: 'ERR_NETWORK' })).toBe(true);
    expect(isUnreachableError({ response: { status: 502 } })).toBe(true);
    expect(isUnreachableError({ response: { status: 503 } })).toBe(true);
    expect(isUnreachableError({ response: { status: 504 } })).toBe(true);
  });

  it('treats any other answer from the API as reachable', () => {
    expect(isUnreachableError({ response: { status: 401 } })).toBe(false);
    expect(isUnreachableError({ response: { status: 404 } })).toBe(false);
    expect(isUnreachableError({ response: { status: 500 } })).toBe(false);
    expect(isUnreachableError(undefined)).toBe(false);
  });
});

// An outage used to look like an empty site, and signed-in members were
// redirected to /login.
describe('during an outage', () => {
  beforeEach(() => {
    act(() => setServerUnreachable(false));
    auth = { user: null, isLoading: false, isAuthenticated: true };
  });

  it('shows the banner only while the server is unreachable', () => {
    wrap(<ServerUnreachableBanner />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    act(() => setServerUnreachable(true));
    expect(screen.getByRole('alert')).toHaveTextContent("We can't reach Ìlú Àṣẹ right now");
    act(() => setServerUnreachable(false));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('keeps a signed-in member on the page instead of sending them to login', () => {
    act(() => setServerUnreachable(true));
    wrap(<RequireAuth><p>Wallet</p></RequireAuth>);
    expect(screen.getByText(/You're still signed in/)).toBeInTheDocument();
    expect(screen.queryByText('Login page')).not.toBeInTheDocument();
  });

  it('still sends a visitor without a session to login', () => {
    act(() => setServerUnreachable(true));
    auth = { user: null, isLoading: false, isAuthenticated: false };
    wrap(<RequireAuth><p>Wallet</p></RequireAuth>);
    expect(screen.getByText('Login page')).toBeInTheDocument();
  });

  it('sends a signed-out member to login when the server is fine', () => {
    wrap(<RequireAuth><p>Wallet</p></RequireAuth>);
    expect(screen.getByText('Login page')).toBeInTheDocument();
  });
});
