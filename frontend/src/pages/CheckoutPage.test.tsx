import { describe, it, expect } from 'vitest';
import { render } from '../test/test-utils';
import CheckoutPage from './CheckoutPage';

describe('CheckoutPage', () => {
    it('renders checkout page without crashing', () => {
        const { container } = render(<CheckoutPage />);
        expect(container).toBeTruthy();
        expect(container.firstChild).toBeTruthy();
    });

    it('renders page content', () => {
        render(<CheckoutPage />);
        expect(document.body.firstChild).toBeTruthy();
    });
});
