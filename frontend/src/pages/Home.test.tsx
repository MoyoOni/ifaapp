import { describe, it, expect } from 'vitest';
import { render } from '../test/test-utils';
import Home from './Home';

describe('Home', () => {
    it('renders home page without crashing', () => {
        const { container } = render(<Home />);
        expect(container).toBeTruthy();
        expect(container.firstChild).toBeTruthy();
    });

    it('renders page content', () => {
        render(<Home />);
        expect(document.body.firstChild).toBeTruthy();
    });
});
