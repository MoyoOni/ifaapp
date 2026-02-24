import { describe, it, expect } from 'vitest';
import { render } from '../test/test-utils';
import ProductDetailPage from './ProductDetailPage';

describe('ProductDetailPage', () => {
    it('renders product detail page without crashing', () => {
        const { container } = render(<ProductDetailPage />);
        expect(container).toBeTruthy();
        expect(container.firstChild).toBeTruthy();
    });

    it('renders page content', () => {
        render(<ProductDetailPage />);
        expect(document.body.firstChild).toBeTruthy();
    });
});
