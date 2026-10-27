import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '@/shared/components/toast';
import ForgotPasswordPage from './ForgotPasswordPage';
import ResetPasswordPage from './ResetPasswordPage';
import ChangePasswordForm from '@/features/auth/change-password-form';
import ChangeEmailForm from '@/features/auth/change-email-form';
import ConfirmEmailChangePage from './ConfirmEmailChangePage';

const apiPost = vi.fn();
vi.mock('@/lib/api', () => ({ default: { post: (...a: unknown[]) => apiPost(...a) } }));

const wrap = (ui: React.ReactElement, path = '/') =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <ToastProvider>
        <MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>
  );

const badRequest = (userMessage: string) => ({ response: { status: 400, data: { success: false, error: { userMessage } } } });

beforeEach(() => {
  apiPost.mockReset();
  localStorage.clear();
});

describe('ForgotPasswordPage', () => {
  it('requests a reset link and shows the neutral confirmation', async () => {
    apiPost.mockResolvedValue({ data: { message: 'If an account exists for that email, a password reset link is on its way.' } });
    wrap(<ForgotPasswordPage />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'adewale@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Send reset link/i }));

    expect(await screen.findByText(/a password reset link is on its way/i)).toBeInTheDocument();
    expect(apiPost).toHaveBeenCalledWith('/auth/forgot-password', { email: 'adewale@example.com' });
  });
});

describe('ResetPasswordPage', () => {
  it('sets the new password from the emailed link', async () => {
    apiPost.mockResolvedValue({ data: { message: 'ok' } });
    wrap(<ResetPasswordPage />, '/reset-password?token=abc123');

    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'BrandNewPass456!' } });
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'BrandNewPass456!' } });
    fireEvent.click(screen.getByRole('button', { name: /Reset password/i }));

    expect(await screen.findByText(/Your password has been reset/i)).toBeInTheDocument();
    expect(apiPost).toHaveBeenCalledWith('/auth/reset-password', { token: 'abc123', password: 'BrandNewPass456!' });
  });

  it("catches mismatched passwords before calling the server", async () => {
    wrap(<ResetPasswordPage />, '/reset-password?token=abc123');

    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'BrandNewPass456!' } });
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'Different456!' } });
    fireEvent.click(screen.getByRole('button', { name: /Reset password/i }));

    expect(await screen.findByText(/don't match/i)).toBeInTheDocument();
    expect(apiPost).not.toHaveBeenCalled();
  });

  it('offers a new link when this one has expired', async () => {
    apiPost.mockRejectedValue(badRequest('This reset link is invalid or has expired. Please request a new one.'));
    wrap(<ResetPasswordPage />, '/reset-password?token=abc123');

    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'BrandNewPass456!' } });
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'BrandNewPass456!' } });
    fireEvent.click(screen.getByRole('button', { name: /Reset password/i }));

    expect(await screen.findByText(/invalid or has expired/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Request a new link/i })).toHaveAttribute('href', '/forgot-password');
  });

  it('explains a link with no token', () => {
    wrap(<ResetPasswordPage />, '/reset-password');
    expect(screen.getByText(/missing its reset code/i)).toBeInTheDocument();
  });
});

// Settings' "Change Password" used to just open the profile page.
describe('ChangePasswordForm', () => {
  const fill = (current: string, next: string, confirm = next) => {
    fireEvent.click(screen.getByRole('button', { name: /Change Password/i }));
    fireEvent.change(screen.getByLabelText('Current password'), { target: { value: current } });
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: next } });
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: confirm } });
    fireEvent.click(screen.getByRole('button', { name: /Update Password/i }));
  };

  it('changes the password and keeps this session with the fresh tokens', async () => {
    apiPost.mockResolvedValue({ data: { accessToken: 'new-access', refreshToken: 'new-refresh' } });
    wrap(<ChangePasswordForm />);

    fill('OriginalPass123!', 'BrandNewPass456!');

    await waitFor(() =>
      expect(apiPost).toHaveBeenCalledWith('/auth/change-password', { currentPassword: 'OriginalPass123!', newPassword: 'BrandNewPass456!' })
    );
    await waitFor(() => expect(localStorage.getItem('accessToken')).toBe('new-access'));
    expect(localStorage.getItem('refreshToken')).toBe('new-refresh');
    expect(await screen.findByText(/signed out on your other devices/i)).toBeInTheDocument();
  });

  it('shows the server error for a wrong current password', async () => {
    apiPost.mockRejectedValue(badRequest('Your current password is incorrect.'));
    wrap(<ChangePasswordForm />);

    fill('WrongPass000!', 'BrandNewPass456!');

    expect(await screen.findByText('Your current password is incorrect.')).toBeInTheDocument();
    expect(localStorage.getItem('accessToken')).toBeNull();
  });
});

// Settings' "Update Email" used to just open the profile page.
describe('ChangeEmailForm', () => {
  it('sends a confirmation link to the new address', async () => {
    apiPost.mockResolvedValue({ data: { message: 'We sent a confirmation link to new@example.com. Your email will change once you open it.' } });
    wrap(<ChangeEmailForm hasPassword />);

    fireEvent.click(screen.getByRole('button', { name: /Update Email/i }));
    fireEvent.change(screen.getByLabelText('New email address'), { target: { value: 'new@example.com' } });
    fireEvent.change(screen.getByLabelText('Current password'), { target: { value: 'OriginalPass123!' } });
    fireEvent.click(screen.getByRole('button', { name: /Send confirmation link/i }));

    expect(await screen.findByText(/confirmation link to new@example.com/i)).toBeInTheDocument();
    expect(apiPost).toHaveBeenCalledWith('/auth/change-email', { newEmail: 'new@example.com', currentPassword: 'OriginalPass123!' });
  });

  it('shows the server error, e.g. an address already in use', async () => {
    apiPost.mockRejectedValue({ response: { status: 409, data: { success: false, error: { userMessage: 'That email address is already in use by another account.' } } } });
    wrap(<ChangeEmailForm hasPassword />);

    fireEvent.click(screen.getByRole('button', { name: /Update Email/i }));
    fireEvent.change(screen.getByLabelText('New email address'), { target: { value: 'taken@example.com' } });
    fireEvent.change(screen.getByLabelText('Current password'), { target: { value: 'OriginalPass123!' } });
    fireEvent.click(screen.getByRole('button', { name: /Send confirmation link/i }));

    expect(await screen.findByText(/already in use/i)).toBeInTheDocument();
  });

  it('asks a Google-only account to set a password first', () => {
    wrap(<ChangeEmailForm hasPassword={false} />);
    fireEvent.click(screen.getByRole('button', { name: /Update Email/i }));
    expect(screen.getByText(/first set a password/i)).toBeInTheDocument();
    expect(screen.queryByLabelText('Current password')).not.toBeInTheDocument();
  });
});

describe('ConfirmEmailChangePage', () => {
  it('confirms the change from the emailed link', async () => {
    apiPost.mockResolvedValue({ data: { message: 'ok', email: 'new@example.com' } });
    wrap(<ConfirmEmailChangePage />, '/confirm-email-change?token=abc123');

    expect(await screen.findByText(/now new@example.com/i)).toBeInTheDocument();
    expect(apiPost).toHaveBeenCalledWith('/auth/confirm-email-change', { token: 'abc123' });
  });

  it('explains an expired link', async () => {
    apiPost.mockRejectedValue(badRequest('This confirmation link is invalid or has expired. Please request the change again.'));
    wrap(<ConfirmEmailChangePage />, '/confirm-email-change?token=abc123');

    expect(await screen.findByText(/invalid or has expired/i)).toBeInTheDocument();
  });
});

