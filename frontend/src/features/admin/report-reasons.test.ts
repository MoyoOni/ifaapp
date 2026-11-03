import { describe, it, expect } from 'vitest';
import { COMPLAINT_REASON_OPTIONS, USER_REPORT_REASON_OPTIONS, reasonLabel } from './report-reasons';

// docs/safeguarding SAFE-01: both report forms carry the safeguarding categories.
describe('report reasons', () => {
  const values = (o: { value: string }[]) => o.map((r) => r.value);
  const safeguarding = ['SEXUAL_MISCONDUCT', 'HARASSMENT', 'CONTROLLING_BEHAVIOR', 'FEAR_BASED_MANIPULATION', 'FINANCIAL_EXPLOITATION', 'CONFIDENTIALITY_BREACH'];

  it('lets members report any of the safeguarding categories about a Babalawo or anyone else', () => {
    expect(values(COMPLAINT_REASON_OPTIONS)).toEqual(expect.arrayContaining(safeguarding));
    expect(values(USER_REPORT_REASON_OPTIONS)).toEqual(expect.arrayContaining(safeguarding));
  });

  it('has a readable label for every option, and admins see labels not codes', () => {
    for (const o of [...COMPLAINT_REASON_OPTIONS, ...USER_REPORT_REASON_OPTIONS]) expect(o.label).toBeTruthy();
    expect(reasonLabel('SEXUAL_MISCONDUCT')).toBe('Sexual misconduct or unwanted contact');
  });
});
