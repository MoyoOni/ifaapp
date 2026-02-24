import { describe, it, expect } from 'vitest';
import { render } from '../test/test-utils';
import GuidancePlansPage from './GuidancePlansPage';

describe('GuidancePlansPage', () => {
    it('renders guidance plans page without crashing', () => {
        const { container } = render(<GuidancePlansPage />);
        expect(container).toBeTruthy();
        expect(container.firstChild).toBeTruthy();
    });

    it('renders page content', () => {
        render(<GuidancePlansPage />);
        expect(document.body.firstChild).toBeTruthy();
    });
});
