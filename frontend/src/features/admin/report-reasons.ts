// Human labels for report and concern reasons (backend: complaints'
// COMPLAINT_REASONS, user-reports' USER_REPORT_REASONS). Shared by the two
// member report forms and the two admin queues so they always agree.
export const REPORT_REASON_LABELS: Record<string, string> = {
  SEXUAL_MISCONDUCT: 'Sexual misconduct or unwanted contact',
  HARASSMENT: 'Harassment or intimidation',
  CONTROLLING_BEHAVIOR: 'Controlling behaviour',
  FEAR_BASED_MANIPULATION: 'Fear-based manipulation',
  FINANCIAL_EXPLOITATION: 'Financial exploitation',
  CONFIDENTIALITY_BREACH: 'Breach of confidentiality',
  INAPPROPRIATE: 'Inappropriate conduct',
  FRAUD: 'Fraud',
  NO_SHOW: 'No-show / unreliable',
  SPAM: 'Spam',
  IMPERSONATION: 'Impersonation',
  OTHER: 'Other concern',
};

export const reasonLabel = (reason: string) => REPORT_REASON_LABELS[reason] ?? reason;

const options = (keys: string[]) => keys.map((value) => ({ value, label: REPORT_REASON_LABELS[value] }));

/** The concern form on a Babalawo's profile. */
export const COMPLAINT_REASON_OPTIONS = options([
  'SEXUAL_MISCONDUCT', 'HARASSMENT', 'CONTROLLING_BEHAVIOR', 'FEAR_BASED_MANIPULATION', 'FINANCIAL_EXPLOITATION',
  'CONFIDENTIALITY_BREACH', 'INAPPROPRIATE', 'FRAUD', 'NO_SHOW', 'OTHER',
]);

/** The report form on everyone else's profile. */
export const USER_REPORT_REASON_OPTIONS = options([
  'SEXUAL_MISCONDUCT', 'HARASSMENT', 'CONTROLLING_BEHAVIOR', 'FEAR_BASED_MANIPULATION', 'FINANCIAL_EXPLOITATION',
  'CONFIDENTIALITY_BREACH', 'INAPPROPRIATE', 'FRAUD', 'IMPERSONATION', 'SPAM', 'OTHER',
]);
