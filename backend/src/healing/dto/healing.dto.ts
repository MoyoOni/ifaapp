import { IsString, IsOptional, IsEmail, MinLength, IsIn } from 'class-validator';

const HEALING_CASE_CATEGORIES = [
  'INTERPERSONAL_CONFLICT',
  'SPIRITUAL_HARM_CONCERN',
  'COMMUNITY_TENSION',
  'OTHER',
] as const;

export class ReportHealingCaseDto {
  @IsIn(HEALING_CASE_CATEGORIES)
  category!: string;

  @IsString()
  @MinLength(1)
  description!: string;

  @IsEmail()
  @IsOptional()
  respondentEmail?: string;
}

export class ResolveHealingCaseDto {
  @IsString()
  @MinLength(1)
  resolutionNotes!: string;
}

export class UpdateElderNotesDto {
  @IsString()
  elderPrivateNotes!: string;
}
