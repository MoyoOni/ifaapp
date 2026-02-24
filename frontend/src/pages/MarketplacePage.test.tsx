import { describe, it, expect } from 'vitest';
import { render } from '../test/test-utils';
import MarketplacePage from './MarketplacePage';

describe('MarketplacePage', () => {
    it('renders marketplace page without crashing', () => {
        const { container } = render(<MarketplacePage />);
        expect(container).toBeTruthy();
        expect(container.firstChild).toBeTruthy();
    });

    it('renders page content', () => {
        render(<MarketplacePage />);
        expect(document.body.firstChild).toBeTruthy();
    });
});
