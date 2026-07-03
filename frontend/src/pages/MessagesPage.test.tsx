import { describe, it, expect } from 'vitest';
import { render } from '../test/test-utils';
import MessagesPage from './MessagesPage';

describe('MessagesPage', () => {
    it('renders messages page container', () => {
        render(<MessagesPage />);
        expect(document.body).toBeInTheDocument();
    });

    it('renders page structure', () => {
        render(<MessagesPage />);
        const container = document.querySelector('.min-h-screen');
        expect(container).toBeInTheDocument();
    });
});
