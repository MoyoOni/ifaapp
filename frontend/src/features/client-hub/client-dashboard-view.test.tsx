import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/test-utils';
import ClientDashboardView from './client-dashboard-view';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockUseClientDashboard = vi.fn();
const mockUseAuth = vi.fn();
vi.mock('@/shared/hooks/use-dashboard', () => ({ useClientDashboard: (...args: unknown[]) => mockUseClientDashboard(...args) }));
vi.mock('@/shared/hooks/use-auth', () => ({ useAuth: () => mockUseAuth() }));

vi.mock('./personal-awo-dashboard', () => ({ default: () => <div data-testid="personal-awo-dashboard">Personal Awo</div> }));

const mockDashboard = {
  recentConsultations: [],
  pendingGuidancePlans: [],
  unreadMessages: 0,
  walletBalance: { amount: 5000, currency: 'NGN' },
  communities: { temples: [], circles: [] },
};

describe('ClientDashboardView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: { id: 'user-1', firstName: 'Test', name: 'Test User' } });
    mockUseClientDashboard.mockReturnValue({
      data: mockDashboard,
      isLoading: false,
      error: null,
    });
  });

  it('renders without crashing', () => {
    const { container } = render(<ClientDashboardView />);
    expect(container).toBeTruthy();
  });

  it('shows loading spinner when isLoading is true', () => {
    mockUseClientDashboard.mockReturnValue({ data: null, isLoading: true });
    render(<ClientDashboardView />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows welcome heading with user name when loaded', () => {
    render(<ClientDashboardView />);
    expect(screen.getByText(/Welcome,/)).toBeInTheDocument();
    expect(screen.getByText(/Test/)).toBeInTheDocument();
  });

  it('shows My Consultations and Guidance Plans stat cards', () => {
    render(<ClientDashboardView />);
    expect(screen.getByText('My Consultations')).toBeInTheDocument();
    expect(screen.getByText('Guidance Plans')).toBeInTheDocument();
  });

  it('shows Find Babalawo and Book Consultation buttons', () => {
    render(<ClientDashboardView />);
    expect(screen.getByRole('button', { name: /Find Babalawo/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Book Consultation/i })).toBeInTheDocument();
  });

  it('shows Personal Awo dashboard section', () => {
    render(<ClientDashboardView />);
    expect(screen.getByTestId('personal-awo-dashboard')).toBeInTheDocument();
  });

  it('has navigation buttons with accessible names', () => {
    render(<ClientDashboardView />);
    const walletButton = screen.getByRole('button', { name: /Wallet Balance/i });
    expect(walletButton).toBeInTheDocument();
  });
});
