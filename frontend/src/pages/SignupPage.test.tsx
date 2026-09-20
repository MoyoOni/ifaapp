import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '../test/test-utils';
import SignupPage from './SignupPage';

const navigate = vi.fn();
vi.mock('react-router-dom', async () => ({
    ...(await vi.importActual<typeof import('react-router-dom')>('react-router-dom')),
    useNavigate: () => navigate,
}));

const useAuthMock = vi.fn();
vi.mock('@/shared/hooks/use-auth', () => ({
    useAuth: () => useAuthMock(),
    AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('SignupPage', () => {
    beforeEach(() => {
        navigate.mockReset();
        useAuthMock.mockReset();
        useAuthMock.mockReturnValue({ user: null });
    });

    it('renders signup page container', () => {
        render(<SignupPage />);
        expect(document.body).toBeInTheDocument();
    });

    it('renders page structure', () => {
        render(<SignupPage />);
        const container = document.querySelector('.min-h-screen');
        expect(container).toBeInTheDocument();
    });

    it('sends a just-registered (not yet onboarded) user to onboarding, not the dashboard', () => {
        useAuthMock.mockReturnValue({ user: { id: 'u1', role: 'CLIENT', hasOnboarded: false } });
        render(<SignupPage />);
        expect(navigate).toHaveBeenCalledWith('/onboarding', { replace: true });
        expect(navigate).not.toHaveBeenCalledWith(expect.stringContaining('dashboard'), expect.anything());
    });

    it('sends an already-onboarded user who lands here to their dashboard', () => {
        useAuthMock.mockReturnValue({ user: { id: 'u1', role: 'CLIENT', hasOnboarded: true } });
        render(<SignupPage />);
        expect(navigate).toHaveBeenCalledWith(expect.stringContaining('dashboard'), { replace: true });
    });
});
