import { describe, it, expect } from 'vitest';
import { render } from '../test/test-utils';
import PrescriptionApprovalPage from './PrescriptionApprovalPage';

describe('PrescriptionApprovalPage', () => {
    it('renders prescription approval page without crashing', () => {
        const { container } = render(<PrescriptionApprovalPage />);
        expect(container).toBeTruthy();
        expect(container.firstChild).toBeTruthy();
    });

    it('renders page content', () => {
        render(<PrescriptionApprovalPage />);
        expect(document.body.firstChild).toBeTruthy();
    });
});
