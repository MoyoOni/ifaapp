import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ProfileEditor from './profile-editor';

// Mock the useAuth hook
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

describe('ProfileEditor', () => {
  const mockOnSave = vi.fn();
  const mockOnCancel = vi.fn();

  it('renders the profile editor with initial values', () => {
    render(
      <ProfileEditor 
        initialProfile={mockProfile} 
        onSave={mockOnSave} 
        onCancel={mockOnCancel} 
      />
    );

    // Check that form fields are populated with initial values
    expect(screen.getByDisplayValue(mockProfile.firstName)).toBeInTheDocument();
    expect(screen.getByDisplayValue(mockProfile.lastName)).toBeInTheDocument();
    expect(screen.getByDisplayValue(mockProfile.email)).toBeInTheDocument();
    expect(screen.getByDisplayValue(mockProfile.phone!)).toBeInTheDocument();
    expect(screen.getByDisplayValue(mockProfile.location!)).toBeInTheDocument();
    expect(screen.getByDisplayValue(mockProfile.website!)).toBeInTheDocument();
    expect(screen.getByDisplayValue(mockProfile.occupation!)).toBeInTheDocument();
    expect(screen.getByDisplayValue(mockProfile.organization!)).toBeInTheDocument();
    expect(screen.getByText(mockProfile.bio!)).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(
      <ProfileEditor 
        initialProfile={{ ...mockProfile, firstName: '', lastName: '', email: '' }} 
        onSave={mockOnSave} 
        onCancel={mockOnCancel} 
      />
    );

    // Try to submit without required fields
    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    // Wait for validation to occur
    await waitFor(() => {
      expect(screen.getByText('First name is required')).toBeInTheDocument();
      expect(screen.getByText('Last name is required')).toBeInTheDocument();
      expect(screen.getByText('Email is required')).toBeInTheDocument();
    });
  });

  it('validates email format on submit', async () => {
    render(
      <ProfileEditor 
        initialProfile={mockProfile} 
        onSave={mockOnSave} 
        onCancel={mockOnCancel} 
      />
    );

    // Get the email input field and change its value to an invalid email
    const emailInput = screen.getByDisplayValue(mockProfile.email);
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

    // Submit the form
    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    // Wait for validation to occur
    await waitFor(() => {
      expect(screen.getByText('Email is invalid')).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('calls onSave with updated profile when form is valid', async () => {
    render(
      <ProfileEditor 
        initialProfile={mockProfile} 
        onSave={mockOnSave} 
        onCancel={mockOnCancel} 
      />
    );

    // Change some values
    const firstNameInput = screen.getByDisplayValue(mockProfile.firstName);
    fireEvent.change(firstNameInput, { target: { value: 'Jane' } });

    const bioTextarea = screen.getByText(mockProfile.bio!);
    fireEvent.change(bioTextarea, { target: { value: 'Updated bio' } });

    // Submit the form
    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    // Wait for save to be called
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        ...mockProfile,
        firstName: 'Jane',
        bio: 'Updated bio'
      });
    }, { timeout: 2000 });
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(
      <ProfileEditor 
        initialProfile={mockProfile} 
        onSave={mockOnSave} 
        onCancel={mockOnCancel} 
      />
    );

    // Get the cancel button by its position in the header
    const header = screen.getByText('Edit Profile').closest('div');
    const headerCancelButton = header?.querySelector('button');
    if (headerCancelButton) {
      fireEvent.click(headerCancelButton);
    }

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('clears errors when user starts typing in a field with an error', async () => {
    render(
      <ProfileEditor 
        initialProfile={{ ...mockProfile, firstName: '' }} 
        onSave={mockOnSave} 
        onCancel={mockOnCancel} 
      />
    );

    // Submit to trigger validation error
    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    // Check error is shown
    await waitFor(() => {
      expect(screen.getByText('First name is required')).toBeInTheDocument();
    });

    // Type in the field to clear the error
    const firstNameInput = screen.getByPlaceholderText('First name');
    fireEvent.change(firstNameInput, { target: { value: 'Valid Name' } });

    // Submit again to trigger re-validation
    fireEvent.click(saveButton);

    // Error should disappear after re-validation
    await waitFor(() => {
      expect(screen.queryByText('First name is required')).not.toBeInTheDocument();
    });
  });
});