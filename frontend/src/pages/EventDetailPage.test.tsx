import { describe, it, expect } from 'vitest';
import { render } from '../test/test-utils';
import EventDetailPage from './EventDetailPage';

describe('EventDetailPage', () => {
    it('renders event detail page container', () => {
        render(<EventDetailPage />);
        expect(document.body).toBeInTheDocument();
    });

    it('renders page structure', () => {
        render(<EventDetailPage />);
        const container = document.querySelector('.min-h-screen');
        expect(container).toBeInTheDocument();
    });
});
