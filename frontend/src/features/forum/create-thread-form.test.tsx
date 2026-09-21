import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { render, screen, fireEvent, waitFor } from '@/test/test-utils';
import CreateThreadForm from './create-thread-form';

const apiGet = vi.fn();
const apiPost = vi.fn();
vi.mock('@/lib/api', () => ({ default: { get: (...a: unknown[]) => apiGet(...a), post: (...a: unknown[]) => apiPost(...a) } }));

vi.mock('@/shared/hooks/use-auth', () => ({
  useAuth: () => ({ user: { id: 'u1', role: 'CLIENT' } }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('CreateThreadForm', () => {
  let invalidate: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    apiGet.mockReset();
    apiPost.mockReset();
    apiGet.mockResolvedValue({ data: [{ id: 'c1', name: 'Ifá & Divination', description: '', icon: '🔮', isSacred: false, isTeachings: false, threadCount: 0 }] });
    invalidate = vi.spyOn(QueryClient.prototype, 'invalidateQueries');
  });
  afterEach(() => invalidate.mockRestore());

  async function fillAndSubmit(container: HTMLElement) {
    await waitFor(() => expect(container.querySelector('select option[value="c1"]')).not.toBeNull());
    fireEvent.change(container.querySelector('select') as HTMLSelectElement, { target: { value: 'c1' } });
    fireEvent.change(container.querySelector('input[type="text"], input:not([type])') as HTMLInputElement, { target: { value: 'A new thread' } });
    fireEvent.change(container.querySelector('textarea') as HTMLTextAreaElement, { target: { value: 'Some body text' } });
    fireEvent.click(screen.getByRole('button', { name: /Create Thread/i }));
  }

  it('refreshes every cached thread list after posting, so the new thread shows up without a manual reload', async () => {
    apiPost.mockResolvedValue({ data: { id: 't1', title: 'A new thread' } });
    const onSuccess = vi.fn();
    const { container } = render(<CreateThreadForm onSuccess={onSuccess} onCancel={vi.fn()} />);

    await fillAndSubmit(container);

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    // the list's real key is ['forum-threads', category, tag]; only a prefix invalidation reaches all variants
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['forum-threads'] });
  });

  it('shows an error and does not close the form when posting fails', async () => {
    apiPost.mockRejectedValue(new Error('500'));
    const onSuccess = vi.fn();
    const { container } = render(<CreateThreadForm onSuccess={onSuccess} onCancel={vi.fn()} />);

    await fillAndSubmit(container);

    expect(await screen.findByText(/Failed to create thread/i)).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
