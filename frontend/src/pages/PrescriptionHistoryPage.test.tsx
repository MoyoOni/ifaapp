import { describe, it, expect } from 'vitest';
import { render } from '../test/test-utils';
import PrescriptionHistoryPage from './PrescriptionHistoryPage';

describe('PrescriptionHistoryPage', () => {
    it('renders prescription history page without crashing', () => {
        const { container } = render(<PrescriptionHistoryPage />);
        expect(container).toBeTruthy();
        expect(container.firstChild).toBeTruthy();
    });

    it('renders page content', () => {
        render(<PrescriptionHistoryPage />);
        expect(document.body.firstChild).toBeTruthy();
    });
});
