import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ProfileView from './profile-view';

// Mock the useAuth hook before importing the component
vi.mock('../../shared/hooks/use-auth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'current-user-id', role: 'CLIENT' },
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
  })),
}));

const mockProfile = {
  id: 'current-user-id',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phone: '+1234567890',
  bio: 'Software developer passionate about web technologies',
  location: 'San Francisco, CA',
  website: 'https://johndoe.example.com',
  occupation: 'Software Engineer',
  organization: 'Example Corp',
  timezone: 'PST',
  avatar: 'https://example.com/avatar.jpg',
};

describe('ProfileView', () => {
  const mockOnEdit = vi.fn();

  it('renders user profile information correctly', () => {
    render(
      <ProfileView profile={mockProfile} onEdit={mockOnEdit} />
    );

    // Check that profile information is displayed
    expect(screen.getByText(`${mockProfile.firstName} ${mockProfile.lastName}`)).toBeInTheDocument();
    expect(screen.getByText(mockProfile.email)).toBeInTheDocument();
    expect(screen.getByText(mockProfile.phone!)).toBeInTheDocument();
    expect(screen.getByText(mockProfile.location!)).toBeInTheDocument();
    
    // Check that the occupation appears in the profile info section
    const occupationElements = screen.getAllByText(mockProfile.occupation!);
    expect(occupationElements.length).toBeGreaterThan(0); // At least one occurrence
    
    // Check that the organization appears in the profile info section
    const organizationElements = screen.getAllByText(mockProfile.organization!);
    expect(organizationElements.length).toBeGreaterThan(0); // At least one occurrence
    
    expect(screen.getByText(mockProfile.bio!)).toBeInTheDocument();
    
    // Check website link - anchor element may append a trailing slash
    const websiteLink = screen.getByText(mockProfile.website!.replace(/^https?:\/\//, ''));
    expect(websiteLink).toBeInTheDocument();
    
    // Compare the URL by checking if the href contains the expected website URL
    const href = (websiteLink as HTMLAnchorElement).href;
    expect(href).toContain(mockProfile.website);
  });

  it('displays edit button for own profile', () => {
    render(
      <ProfileView profile={mockProfile} onEdit={mockOnEdit} />
    );

    const editButton = screen.getByText('Edit Profile');
    expect(editButton).toBeInTheDocument();

    fireEvent.click(editButton);
    expect(mockOnEdit).toHaveBeenCalledTimes(1);
  });

  it('does not display edit button for other profiles', () => {
    const otherUserProfile = { ...mockProfile, id: 'different-user-id' };
    
    render(
      <ProfileView profile={otherUserProfile} onEdit={mockOnEdit} />
    );

    const editButton = screen.queryByText('Edit Profile');
    expect(editButton).not.toBeInTheDocument();
  });

  it('renders correctly when optional fields are missing', () => {
    const profileWithoutOptionalFields = {
      id: 'current-user-id',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
    };

    render(
      <ProfileView profile={profileWithoutOptionalFields} onEdit={mockOnEdit} />
    );

    expect(screen.getByText(`${profileWithoutOptionalFields.firstName} ${profileWithoutOptionalFields.lastName}`)).toBeInTheDocument();
    expect(screen.getByText(profileWithoutOptionalFields.email)).toBeInTheDocument();
    
    // Ensure optional fields are not rendered when not present
    expect(screen.queryByText('+1234567890')).not.toBeInTheDocument();
    expect(screen.queryByText('San Francisco, CA')).not.toBeInTheDocument();
  });
});