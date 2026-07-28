import { IsString, IsOptional, IsArray, IsIn, MinLength } from 'class-validator';

// COMMUNITY_BACKLOG.md FOR-016: the "documented (not automated) list of
// known-harmful-practitioner flags" -- a curated reason taxonomy on the
// existing PractitionerComplaint intake, same precedent as FOR-001's
// ContentFlagRule seed (a human-curated list, not keyword/ML detection).
// NO_SHOW/INAPPROPRIATE/FRAUD/OTHER were the pre-existing conventional
// values (never enforced at the DB level, since `reason` is a free string);
// the three below are new, added specifically for FOR-016's harm concerns.
export const COMPLAINT_REASONS = [
  'NO_SHOW',
  'INAPPROPRIATE',
  'FRAUD',
  'CONTROLLING_BEHAVIOR',
  'FEAR_BASED_MANIPULATION',
  'FINANCIAL_EXPLOITATION',
  'OTHER',
] as const;

export class FileComplaintDto {
  @IsString()
  declare practitionerId: string;

  @IsIn(COMPLAINT_REASONS)
  declare reason: string;

  @IsString()
  @MinLength(10)
  declare description: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  declare evidence?: string[];
}
