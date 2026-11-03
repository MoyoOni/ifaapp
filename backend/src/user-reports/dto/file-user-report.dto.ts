import { IsString, IsIn, MinLength } from 'class-validator';

export const USER_REPORT_REASONS = [
  'HARASSMENT',
  'SPAM',
  'IMPERSONATION',
  'INAPPROPRIATE',
  'FRAUD',
  // Safeguarding policy (docs/safeguarding, SAFE-01, November 3, 2026):
  // anyone -- an elder, a vendor, a member -- can exploit someone, not only
  // a Babalawo (whose profile uses the complaint form instead).
  'SEXUAL_MISCONDUCT',
  'CONFIDENTIALITY_BREACH',
  'CONTROLLING_BEHAVIOR',
  'FEAR_BASED_MANIPULATION',
  'FINANCIAL_EXPLOITATION',
  'OTHER',
] as const;

export class FileUserReportDto {
  @IsString()
  declare reportedUserId: string;

  @IsIn(USER_REPORT_REASONS)
  declare reason: string;

  @IsString()
  @MinLength(10)
  declare description: string;
}
