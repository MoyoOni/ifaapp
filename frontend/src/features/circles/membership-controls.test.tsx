import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../../contexts/theme-context';
import MembershipControls from './membership-controls';

// Mock the API module
jest.mock('../../../services/api', () => ({
  circlesApi: {
    joinCircle: jest.fn(),
    leaveCircle: jest.fn(),
    inviteToCircle: jest.fn(),
    updateMemberRole: jest.fn(),
    removeMember: jest.fn(),
  },
}));

const { circlesApi } = require('../../../services/api');

describe('MembershipControls Component', () => {
  const mockCircleId = 'circle1';
  const mockUserId = 'user1';
  const mockOwnerId = 'owner1';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders join button for non-member user', () => {
    render(
      <ThemeProvider>
        <MemoryRouter>
          <MembershipControls 
            circleId={mockCircleId} 
            userId={mockUserId} 
            isMember={false} 
            isOwner={false} 
            userRole={null} 
          />
        </MemoryRouter>
      </ThemeProvider>
    );

    expect(screen.getByText(/join circle/i)).toBeInTheDocument();
    expect(screen.queryByText(/leave circle/i)).not.toBeInTheDocument();
  });

  it('renders leave button for member user', () => {
    render(
      <ThemeProvider>
        <MemoryRouter>
          <MembershipControls 
            circleId={mockCircleId} 
            userId={mockUserId} 
            isMember={true} 
            isOwner={false} 
            userRole="MEMBER" 
          />
        </MemoryRouter>
      </ThemeProvider>
    );

    expect(screen.getByText(/leave circle/i)).toBeInTheDocument();
    expect(screen.queryByText(/join circle/i)).not.toBeInTheDocument();
  });

  it('handles joining a circle', async () => {
    (circlesApi.joinCircle as jest.MockedFunction<typeof circlesApi.joinCircle>).mockResolvedValue({ success: true });

    render(
      <ThemeProvider>
        <MemoryRouter>
          <MembershipControls 
            circleId={mockCircleId} 
            userId={mockUserId} 
            isMember={false} 
            isOwner={false} 
            userRole={null} 
          />
        </MemoryRouter>
      </ThemeProvider>
    );

    fireEvent.click(screen.getByText(/join circle/i));

    await waitFor(() => {
      expect(circlesApi.joinCircle).toHaveBeenCalledWith(mockCircleId);
    });

    expect(screen.getByText(/joined circle successfully/i)).toBeInTheDocument();
  });

  it('handles leaving a circle', async () => {
    (circlesApi.leaveCircle as jest.MockedFunction<typeof circlesApi.leaveCircle>).mockResolvedValue({ success: true });

    render(
      <ThemeProvider>
        <MemoryRouter>
          <MembershipControls 
            circleId={mockCircleId} 
            userId={mockUserId} 
            isMember={true} 
            isOwner={false} 
            userRole="MEMBER" 
          />
        </MemoryRouter>
      </ThemeProvider>
    );

    fireEvent.click(screen.getByText(/leave circle/i));

    await waitFor(() => {
      expect(circlesApi.leaveCircle).toHaveBeenCalledWith(mockCircleId);
    });

    expect(screen.getByText(/left circle successfully/i)).toBeInTheDocument();
  });

  it('renders admin controls for admin users', () => {
    render(
      <ThemeProvider>
        <MemoryRouter>
          <MembershipControls 
            circleId={mockCircleId} 
            userId={mockUserId} 
            isMember={true} 
            isOwner={false} 
            userRole="ADMIN" 
          />
        </MemoryRouter>
      </ThemeProvider>
    );

    expect(screen.getByText(/manage members/i)).toBeInTheDocument();
    expect(screen.getByText(/invite users/i)).toBeInTheDocument();
  });

  it('handles inviting users', async () => {
    (circlesApi.inviteToCircle as jest.MockedFunction<typeof circlesApi.inviteToCircle>).mockResolvedValue({ success: true });

    render(
      <ThemeProvider>
        <MemoryRouter>
          <MembershipControls 
            circleId={mockCircleId} 
            userId={mockOwnerId} 
            isMember={true} 
            isOwner={true} 
            userRole="ADMIN" 
          />
        </MemoryRouter>
      </ThemeProvider>
    );

    fireEvent.change(screen.getByPlaceholderText(/email/i), { target: { value: 'newuser@example.com' } });
    fireEvent.click(screen.getByText(/send invite/i));

    await waitFor(() => {
      expect(circlesApi.inviteToCircle).toHaveBeenCalledWith({
        circleId: mockCircleId,
        email: 'newuser@example.com',
      });
    });

    expect(screen.getByText(/invitation sent successfully/i)).toBeInTheDocument();
  });

  it('handles role updates', async () => {
    (circlesApi.updateMemberRole as jest.MockedFunction<typeof circlesApi.updateMemberRole>).mockResolvedValue({ success: true });

    render(
      <ThemeProvider>
        <MemoryRouter>
          <MembershipControls 
            circleId={mockCircleId} 
            userId={mockOwnerId} 
            isMember={true} 
            isOwner={true} 
            userRole="ADMIN" 
          />
        </MemoryRouter>
      </ThemeProvider>
    );

    fireEvent.change(screen.getByTestId('role-select'), { target: { value: 'MODERATOR' } });
    fireEvent.click(screen.getByText(/update role/i));

    await waitFor(() => {
      expect(circlesApi.updateMemberRole).toHaveBeenCalledWith({
        circleId: mockCircleId,
        memberId: mockUserId,
        role: 'MODERATOR',
      });
    });

    expect(screen.getByText(/role updated successfully/i)).toBeInTheDocument();
  });

  it('handles member removal', async () => {
    (circlesApi.removeMember as jest.MockedFunction<typeof circlesApi.removeMember>).mockResolvedValue({ success: true });

    render(
      <ThemeProvider>
        <MemoryRouter>
          <MembershipControls 
            circleId={mockCircleId} 
            userId={mockOwnerId} 
            isMember={true} 
            isOwner={true} 
            userRole="ADMIN" 
          />
        </MemoryRouter>
      </ThemeProvider>
    );

    fireEvent.click(screen.getByText(/remove member/i));

    await waitFor(() => {
      expect(circlesApi.removeMember).toHaveBeenCalledWith({
        circleId: mockCircleId,
        memberId: mockUserId,
      });
    });

    expect(screen.getByText(/member removed successfully/i)).toBeInTheDocument();
  });
});