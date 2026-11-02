import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/test-utils';
import { SupportDirectory } from './support-directory';
import SupportDirectoryManager from '@/features/admin/support-directory-manager';

const apiGet = vi.fn();
const apiPost = vi.fn();
vi.mock('@/lib/api', () => ({
  default: { get: (...a: unknown[]) => apiGet(...a), post: (...a: unknown[]) => apiPost(...a), patch: vi.fn(), delete: vi.fn() },
}));
vi.mock('@/shared/components/toast', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/components/toast')>()),
  useToast: () => ({ success: vi.fn(), error: vi.fn() }),
}));

// FOR-015/FOR-017: the admin-managed support directory.
describe('support directory', () => {
  beforeEach(() => {
    apiGet.mockReset();
    apiPost.mockReset().mockResolvedValue({ data: {} });
  });

  it('lists the organisations admins have added, with a tap-to-call number and a website link', async () => {
    apiGet.mockResolvedValue({
      data: [{ id: 'r1', name: 'Test Grief Line', country: 'Nigeria', helpsWith: 'Grief support', phone: '+234 800 000 0000', url: 'https://example.org' }],
    });
    render(<SupportDirectory />);
    expect(await screen.findByText('Test Grief Line')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /\+234 800 000 0000/ })).toHaveAttribute('href', 'tel:+2348000000000');
    expect(screen.getByRole('link', { name: /Website/ })).toHaveAttribute('href', 'https://example.org');
  });

  it('falls back to the support email when no organisations have been added yet', async () => {
    apiGet.mockResolvedValue({ data: [] });
    render(<SupportDirectory />);
    expect(await screen.findByRole('link', { name: 'hello@iluase.com' })).toHaveAttribute('href', 'mailto:hello@iluase.com');
  });

  it('lets an admin add an organisation, sending only the fields filled in', async () => {
    apiGet.mockResolvedValue({ data: [] });
    render(<SupportDirectoryManager />);
    fireEvent.change(await screen.findByPlaceholderText('Name of the service'), { target: { value: 'Test Grief Line' } });
    fireEvent.change(screen.getByPlaceholderText('e.g. Nigeria, or International'), { target: { value: 'Nigeria' } });
    fireEvent.change(screen.getByPlaceholderText('e.g. Crisis and suicide prevention'), { target: { value: 'Grief support' } });
    fireEvent.change(screen.getByPlaceholderText('https://…'), { target: { value: 'https://example.org' } });
    fireEvent.click(screen.getByRole('button', { name: /Add Organisation/ }));
    await waitFor(() =>
      expect(apiPost).toHaveBeenCalledWith('/support-resources', {
        name: 'Test Grief Line', country: 'Nigeria', helpsWith: 'Grief support', url: 'https://example.org',
      })
    );
  });
});
