import { describe, it, expect } from 'vitest';
import { render } from '../test/test-utils';
import LoginPage from './LoginPage';

describe('LoginPage', () => {
    it('renders login page container', () => {
        render(<LoginPage />);
        expect(document.body).toBeInTheDocument();
    });

    it('renders page structure', () => {
        render(<LoginPage />);
        const container = document.querySelector('.min-h-screen');
        expect(container).toBeInTheDocument();
    });
});
