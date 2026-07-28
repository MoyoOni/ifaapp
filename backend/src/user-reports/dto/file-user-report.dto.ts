import { IsString, IsIn, MinLength } from 'class-validator';

export const USER_REPORT_REASONS = [
  'HARASSMENT',
  'SPAM',
  'IMPERSONATION',
  'INAPPROPRIATE',
  'FRAUD',
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
