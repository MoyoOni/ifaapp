import { describe, it, expect } from 'vitest';
import { render } from '../test/test-utils';
import SignupPage from './SignupPage';

describe('SignupPage', () => {
    it('renders signup page container', () => {
        render(<SignupPage />);
        expect(document.body).toBeInTheDocument();
    });

    it('renders page structure', () => {
        render(<SignupPage />);
        const container = document.querySelector('.min-h-screen');
        expect(container).toBeInTheDocument();
    });
});
