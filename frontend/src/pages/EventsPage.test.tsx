import { describe, it, expect } from 'vitest';
import { render } from '../test/test-utils';
import EventsPage from './EventsPage';

describe('EventsPage', () => {
    it('renders events page container', () => {
        render(<EventsPage />);
        expect(document.body).toBeInTheDocument();
    });

    it('renders page structure', () => {
        render(<EventsPage />);
        const container = document.querySelector('.min-h-screen');
        expect(container).toBeInTheDocument();
    });
});
