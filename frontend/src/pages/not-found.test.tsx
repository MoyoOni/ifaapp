import { describe, it, expect } from 'vitest';
import { render, screen } from '../test/test-utils';
import NotFoundPage from './not-found';

describe('NotFoundPage', () => {
    it('renders 404 page', () => {
        render(<NotFoundPage />);
        expect(document.body).toBeTruthy();
    });

    it('displays 404 message', () => {
        render(<NotFoundPage />);
        const heading = screen.getByRole('heading', { name: 'Page Not Found' });
        expect(heading).toBeTruthy();
    });

    it('has navigation link', () => {
        render(<NotFoundPage />);
        const links = screen.queryAllByRole('link');
        expect(links.length).toBeGreaterThan(0);
    });

    it('accessibility: Return Home link has accessible name and correct href', () => {
        render(<NotFoundPage />);
        const homeLink = screen.getByRole('link', { name: /Return Home/i });
        expect(homeLink).toHaveAttribute('href', '/');
    });

    it('accessibility: has single h1 for 404', () => {
        render(<NotFoundPage />);
        const h1s = screen.getAllByRole('heading', { level: 1 });
        expect(h1s.length).toBe(1);
        expect(h1s[0]).toHaveTextContent('404');
    });
});
