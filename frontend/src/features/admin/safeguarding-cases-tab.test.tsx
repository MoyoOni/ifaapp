import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/test-utils';
import SafeguardingCasesTab from './safeguarding-cases-tab';

const apiGet = vi.fn();
const apiPost = vi.fn();
vi.mock('@/lib/api', () => ({ default: { get: (...a: unknown[]) => apiGet(...a), post: (...a: unknown[]) => apiPost(...a), patch: vi.fn() } }));
vi.mock('@/shared/hooks/use-auth', () => ({
  useAuth: () => ({ user: { id: 'lead-1', role: 'ADMIN' }, isAuthenticated: true }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const summary = {
  id: 'c1', ref: 'SG-0007', source: 'USER_REPORT', category: 'SEXUAL_MISCONDUCT', summary: 'Unwanted advances after a reading',
  priority: 1, status: 'OPEN', createdAt: '2026-11-03T10:00:00Z', subject: { id: 's1', name: 'Subject', role: 'CLIENT' }, reporter: { id: 'r1', name: 'Reporter' }, handler: null,
};

// docs/safeguarding SAFE-02/05
describe('SafeguardingCasesTab', () => {
  beforeEach(() => {
    apiPost.mockReset().mockResolvedValue({ data: {} });
    apiGet.mockImplementation((url: string) =>
      Promise.resolve({
        data: url.startsWith('/safeguarding/cases/c1')
          ? { ...summary, subjectId: 's1', reporterId: 'r1', entries: [{ id: 'e1', kind: 'SYSTEM', text: 'Case opened from user report.', author: null, createdAt: '2026-11-03T10:00:00Z' }], restrictions: [] }
          : { cases: [summary], crisisOpen: 2, alertsConfigured: false },
      })
    );
  });

  it('lists cases priority-first with their labels, and says how many crisis flags are waiting', async () => {
    render(<SafeguardingCasesTab />);
    expect(await screen.findByText('SG-0007')).toBeInTheDocument();
    expect(screen.getByText('P1 Critical')).toBeInTheDocument();
    expect(screen.getByText('Sexual misconduct or unwanted contact')).toBeInTheDocument();
    expect(screen.getByText(/2 crisis flags waiting/)).toBeInTheDocument();
  });

  it('applies a no-contact restriction that protects the reporter, recorded on the case', async () => {
    render(<SafeguardingCasesTab />);
    fireEvent.click(await screen.findByText('SG-0007'));
    fireEvent.change(await screen.findByLabelText('Restriction'), { target: { value: 'NO_CONTACT' } });
    fireEvent.change(screen.getByLabelText('Reason'), { target: { value: 'Protecting the reporter' } });
    fireEvent.click(screen.getByRole('button', { name: 'Apply Restriction' }));
    await waitFor(() =>
      expect(apiPost).toHaveBeenCalledWith('/safeguarding/restrictions', {
        userId: 's1', caseId: 'c1', type: 'NO_CONTACT', reason: 'Protecting the reporter', protectedUserId: 'r1',
      })
    );
  });
});
