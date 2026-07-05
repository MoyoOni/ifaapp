import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ConsultationNotesPanel from './consultation-notes-panel';

const mockApiGet = vi.fn();
const mockApiPost = vi.fn();
vi.mock('@/lib/api', () => ({
  default: {
    get: (...args: unknown[]) => mockApiGet(...args),
    post: (...args: unknown[]) => mockApiPost(...args),
  },
}));

function renderPanel() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ConsultationNotesPanel babalawoId="babalawo-1" clientId="client-1" />
    </QueryClientProvider>
  );
}

describe('ConsultationNotesPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows a loading state, then the empty state when there are no notes', async () => {
    mockApiGet.mockResolvedValue({ data: [] });

    renderPanel();

    expect(screen.getByText('Loading notes...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('No notes yet. Add your first note above.')).toBeInTheDocument();
    });

    expect(mockApiGet).toHaveBeenCalledWith('/consultation-notes/babalawo/babalawo-1/client/client-1');
  });

  it('shows an error state when the fetch fails', async () => {
    mockApiGet.mockRejectedValue(new Error('network error'));

    renderPanel();

    await waitFor(() => {
      expect(screen.getByText('Failed to load notes')).toBeInTheDocument();
    });
  });

  it('renders existing notes with title and content', async () => {
    mockApiGet.mockResolvedValue({
      data: [
        {
          id: 'note-1',
          title: 'First session',
          content: 'Client is seeking clarity on career direction.',
          createdAt: '2026-01-01T10:00:00Z',
          updatedAt: '2026-01-01T10:00:00Z',
        },
      ],
    });

    renderPanel();

    await waitFor(() => {
      expect(screen.getByText('First session')).toBeInTheDocument();
    });
    expect(screen.getByText('Client is seeking clarity on career direction.')).toBeInTheDocument();
  });

  it('creates a new note via the form and refetches', async () => {
    mockApiGet.mockResolvedValue({ data: [] });
    mockApiPost.mockResolvedValue({ data: { id: 'note-2' } });

    renderPanel();

    await waitFor(() => {
      expect(screen.getByText('No notes yet. Add your first note above.')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('Note content...'), {
      target: { value: 'A new private note' },
    });
    fireEvent.click(screen.getByText('Add Note'));

    await waitFor(() => {
      expect(mockApiPost).toHaveBeenCalledWith(
        '/consultation-notes/babalawo/babalawo-1/client/client-1',
        { title: undefined, content: 'A new private note' }
      );
    });
  });

  it('disables the Add Note button until content is entered', async () => {
    mockApiGet.mockResolvedValue({ data: [] });

    renderPanel();

    await waitFor(() => {
      expect(screen.getByText('Add Note')).toBeDisabled();
    });

    fireEvent.change(screen.getByPlaceholderText('Note content...'), {
      target: { value: 'x' },
    });

    expect(screen.getByText('Add Note')).not.toBeDisabled();
  });
});
