import { describe, it, expect } from 'vitest';
import { render } from '../test/test-utils';
import PrescriptionCreationPage from './PrescriptionCreationPage';

describe('PrescriptionCreationPage', () => {
    it('renders prescription creation page without crashing', () => {
        const { container } = render(<PrescriptionCreationPage />);
        expect(container).toBeTruthy();
        expect(container.firstChild).toBeTruthy();
    });

    it('renders page content', () => {
        render(<PrescriptionCreationPage />);
        expect(document.body.firstChild).toBeTruthy();
    });
});
