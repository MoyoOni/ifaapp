import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ProfilePage from './profile-page';

// Mock the child components
vi.mock('../../components/profile/profile-view', () => ({
  default: ({ onEdit }: { onEdit: () => void }) => (
    <div data-testid="profile-view">
      <span>Profile View</span>
      <button onClick={onEdit}>Edit Profile</button>
    </div>
  ),
}));

vi.mock('../../components/profile/profile-editor', () => ({
  default: ({ onCancel }: { onSave: () => void; onCancel: () => void }) => (
    <div data-testid="profile-editor">
      <span>Edit Profile Form</span>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

// Mock the useAuth hook
vi.mock('../../shared/hooks/use-auth', () => ({
  useAuth: vi.fn(() => ({
    user: {
      id: 'test-user-id',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      role: 'CLIENT'
    },
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
  })),
}));

describe('ProfilePage', () => {
  it('renders the profile view by default', () => {
    render(<ProfilePage />);

    expect(screen.getByText('Profile View')).toBeInTheDocument();
    expect(screen.getByTestId('profile-view')).toBeInTheDocument();
    expect(screen.queryByTestId('profile-editor')).not.toBeInTheDocument();
  });

  it('switches to profile editor when edit button is clicked', () => {
    render(<ProfilePage />);

    const editButton = screen.getByText('Edit Profile');
    fireEvent.click(editButton);

    expect(screen.getByTestId('profile-editor')).toBeInTheDocument();
    expect(screen.getByText('Edit Profile Form')).toBeInTheDocument();
    expect(screen.queryByTestId('profile-view')).not.toBeInTheDocument();
  });

  it('switches back to profile view when cancel is clicked in editor', () => {
    render(<ProfilePage />);

    // Switch to editor first
    const editButton = screen.getByText('Edit Profile');
    fireEvent.click(editButton);

    // Then cancel to go back to view
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(screen.getByTestId('profile-view')).toBeInTheDocument();
    expect(screen.getByText('Profile View')).toBeInTheDocument();
    expect(screen.queryByTestId('profile-editor')).not.toBeInTheDocument();
  });

  it('renders the page title', () => {
    render(<ProfilePage />);

    expect(screen.getByText('My Profile')).toBeInTheDocument();
    expect(
      screen.getByText('Manage your personal information and preferences')
    ).toBeInTheDocument();
  });
});