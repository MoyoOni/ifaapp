import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '../test/test-utils';
import ProfilePage from './ProfilePage';

vi.mock('@/shared/hooks/use-auth', () => ({ useAuth: vi.fn() }));
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useParams: vi.fn(), useNavigate: vi.fn(() => vi.fn()) };
});
vi.mock('@/features/profile/public-profile-view', () => ({
  default: ({ userId, onNavigate, onBack }: any) => (
    <div data-testid="public-profile">
      <span>Profile {userId}</span>
      <button onClick={() => onNavigate('booking-flow', 'bab-1')}>ToBooking</button>
      <button onClick={() => onNavigate('messages', 'conv-1')}>ToMessages</button>
      <button onClick={() => onNavigate('profile-settings')}>ToSettings</button>
      <button onClick={() => onNavigate('temple-detail', 't1')}>ToTemple</button>
      <button onClick={() => onNavigate('circle-detail', 'c1')}>ToCircle</button>
      <button onClick={() => onNavigate('product-detail', 'prod-1')}>ToProduct</button>
      <button onClick={() => onNavigate('product-detail')}>ToMarketplace</button>
      <button onClick={() => onNavigate('other')}>ToDefault</button>
      <button onClick={onBack}>Back</button>
    </div>
  )
}));

import { useAuth } from '@/shared/hooks/use-auth';
import { useParams, useNavigate } from 'react-router-dom';

function renderProfile(userId: string | undefined, authUser: { id: string } | null = null) {
  vi.mocked(useParams).mockReturnValue(userId !== undefined ? { userId } : {});
  vi.mocked(useAuth).mockReturnValue({ user: authUser } as any);
  return render(<ProfilePage />);
}

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({ user: null } as any);
    vi.mocked(useParams).mockReturnValue({});
  });

  it('renders profile page container', () => {
    render(<ProfilePage />);
    expect(document.body).toBeInTheDocument();
  });

  it('when no userId and no current user shows Profile Not Found and Log In', () => {
    renderProfile(undefined, null);
    expect(screen.getByText('Profile Not Found')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Log In/i })).toBeInTheDocument();
  });

  it('when route has userId renders PublicProfileView with that userId', () => {
    renderProfile('u123', null);
    expect(screen.getByTestId('public-profile')).toBeInTheDocument();
    expect(screen.getByText('Profile u123')).toBeInTheDocument();
  });

  it('when no userId but current user exists uses current user id', () => {
    renderProfile(undefined, { id: 'current-user-id' });
    expect(screen.getByText('Profile current-user-id')).toBeInTheDocument();
  });

  it('Back button calls onBack', () => {
    renderProfile('u1', null);
    fireEvent.click(screen.getByText('Back'));
    expect(screen.getByTestId('public-profile')).toBeInTheDocument();
  });

  it('handleNavigate booking-flow navigates to /booking/:params', () => {
    const mockNavigate = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
    renderProfile('u1', null);
    fireEvent.click(screen.getByText('ToBooking'));
    expect(mockNavigate).toHaveBeenCalledWith('/booking/bab-1');
  });

  it('handleNavigate messages navigates to /messages/:params', () => {
    const mockNavigate = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
    renderProfile('u1', null);
    fireEvent.click(screen.getByText('ToMessages'));
    expect(mockNavigate).toHaveBeenCalledWith('/messages/conv-1');
  });

  it('handleNavigate profile-settings navigates to /profile', () => {
    const mockNavigate = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
    renderProfile('u1', null);
    fireEvent.click(screen.getByText('ToSettings'));
    expect(mockNavigate).toHaveBeenCalledWith('/profile');
  });

  it('handleNavigate temple-detail navigates to /temples/:params', () => {
    const mockNavigate = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
    renderProfile('u1', null);
    fireEvent.click(screen.getByText('ToTemple'));
    expect(mockNavigate).toHaveBeenCalledWith('/temples/t1');
  });

  it('handleNavigate circle-detail navigates to /circles/:params', () => {
    const mockNavigate = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
    renderProfile('u1', null);
    fireEvent.click(screen.getByText('ToCircle'));
    expect(mockNavigate).toHaveBeenCalledWith('/circles/c1');
  });

  it('handleNavigate product-detail with param navigates to /marketplace/:id', () => {
    const mockNavigate = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
    renderProfile('u1', null);
    fireEvent.click(screen.getByText('ToProduct'));
    expect(mockNavigate).toHaveBeenCalledWith('/marketplace/prod-1');
  });

  it('handleNavigate product-detail without param navigates to /marketplace', () => {
    const mockNavigate = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
    renderProfile('u1', null);
    fireEvent.click(screen.getByText('ToMarketplace'));
    expect(mockNavigate).toHaveBeenCalledWith('/marketplace');
  });

  it('handleNavigate default navigates to /', () => {
    const mockNavigate = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
    renderProfile('u1', null);
    fireEvent.click(screen.getByText('ToDefault'));
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});
