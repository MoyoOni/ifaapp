import { describe, it, expect } from 'vitest';
import { render } from '../test/test-utils';
import CartPage from './CartPage';

describe('CartPage', () => {
    it('renders cart page without crashing', () => {
        const { container } = render(<CartPage />);
        expect(container).toBeTruthy();
        expect(container.firstChild).toBeTruthy();
    });

    it('renders page content', () => {
        render(<CartPage />);
        expect(document.body.firstChild).toBeTruthy();
    });
});
