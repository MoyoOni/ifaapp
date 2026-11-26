import { StrictMode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import VerifyEmailPage from './VerifyEmailPage';

const apiPost = vi.fn();
const apiGet = vi.fn();
vi.mock('@/lib/api', () => ({ default: { post: (...a: unknown[]) => apiPost(...a), get: (...a: unknown[]) => apiGet(...a) } }));

const renderAt = (url: string) =>
  render(
    <StrictMode>
      <MemoryRouter initialEntries={[url]}><VerifyEmailPage /></MemoryRouter>
    </StrictMode>
  );

beforeEach(() => { apiPost.mockReset(); apiGet.mockReset(); });

describe('VerifyEmailPage', () => {
  it.each(['/verify-email#token=abc123', '/verify-email?token=abc123'])('posts the token in the body exactly once (%s)', async (url) => {
    apiPost.mockResolvedValue({ data: { message: 'Email verified successfully. You can now sign in.' } });
    renderAt(url);
    expect(await screen.findByText(/Email verified successfully/)).toBeInTheDocument();
    expect(apiPost).toHaveBeenCalledTimes(1);
    expect(apiPost).toHaveBeenCalledWith('/auth/verify-email', { token: 'abc123' });
    expect(apiGet).not.toHaveBeenCalled();
  });

  it('explains a link with no token without calling the server', () => {
    renderAt('/verify-email');
    expect(screen.getByText(/No verification token found/)).toBeInTheDocument();
    expect(apiPost).not.toHaveBeenCalled();
  });

  it('shows the server message for a used or expired link', async () => {
    apiPost.mockRejectedValue({ response: { data: { message: 'Invalid or expired verification token' } } });
    renderAt('/verify-email#token=used');
    expect(await screen.findByText(/Invalid or expired verification token/)).toBeInTheDocument();
  });
});
