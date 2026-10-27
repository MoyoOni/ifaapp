import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@/test/test-utils';
import AdminCulturalContentTab from './admin-cultural-content-tab';

const apiGet = vi.fn();
vi.mock('@/lib/api', () => ({
  default: { get: (...a: unknown[]) => apiGet(...a), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));
vi.mock('@/shared/hooks/use-auth', () => ({
  useAuth: () => ({ user: { id: 'admin-1', role: 'ADMIN' } }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const entry = {
  id: 'oh-1',
  title: 'Ìtàn Ọ̀rúnmìlà (revised)',
  category: 'ODU',
  tags: ['odu'],
  content: 'A corrected telling.',
  relatedProductIds: [],
  publishedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
};

const openHistory = async () => {
  render(<AdminCulturalContentTab />);
  fireEvent.click(await screen.findByRole('button', { name: /Oral History Archive/i }));
  fireEvent.click(await screen.findByRole('button', { name: `Revision history for ${entry.title}` }));
};

describe('Oral history revision history (FOR-024)', () => {
  beforeEach(() => {
    apiGet.mockReset();
  });

  it("shows an entry's previous versions with who replaced them", async () => {
    apiGet.mockImplementation(async (url: string) => {
      if (url === '/admin/cultural/oral-histories') return { data: [entry] };
      if (url === '/admin/cultural/oral-histories/oh-1/revisions')
        return {
          data: [
            { id: 'r-2', title: 'Ìtàn Ọ̀rúnmìlà', category: 'ODU', tags: ['odu'], content: 'A corrected telling.', createdAt: new Date().toISOString(), editor: { id: 'admin-1', name: 'Ìyá Àdùnní' } },
            { id: 'r-1', title: 'Ìtàn Ọ̀rúnmìlà', category: 'ODU', tags: ['odu'], content: 'The original telling.', createdAt: new Date().toISOString(), editor: null },
          ],
        };
      return { data: [] };
    });
    await openHistory();

    expect(await screen.findByText('The original telling.')).toBeInTheDocument();
    expect(screen.getByText(/by Ìyá Àdùnní/)).toBeInTheDocument();
  });

  it('says so when an entry has never been edited', async () => {
    apiGet.mockImplementation(async (url: string) => ({ data: url === '/admin/cultural/oral-histories' ? [entry] : [] }));
    await openHistory();

    expect(await screen.findByText(/No earlier versions/i)).toBeInTheDocument();
  });
});
