/**
 * Basic accessibility tests: roles, headings, and keyboard/navigation patterns.
 * Run with: npm run test -- src/test/accessibility.test.tsx
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/test-utils';
import NotFoundPage from '@/pages/not-found';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => () => {} };
});

describe('Accessibility', () => {
  describe('NotFoundPage', () => {
    it('has role=link for navigation with visible text', () => {
      render(<NotFoundPage />);
      const link = screen.getByRole('link', { name: /Return Home/i });
      expect(link).toBeInTheDocument();
    });

    it('has heading hierarchy (h1, h2, h3)', () => {
      render(<NotFoundPage />);
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('404');
      expect(screen.getByRole('heading', { name: 'Page Not Found' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /Need help/i })).toBeInTheDocument();
    });
  });
});
