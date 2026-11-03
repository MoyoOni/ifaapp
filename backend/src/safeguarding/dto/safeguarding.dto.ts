import { IsDateString, IsIn, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min, MinLength, ValidateIf } from 'class-validator';
import { RESTRICTION_TYPES } from '../restrictions.service';

export class AcceptStandardsDto {
  @IsString()
  declare version: string;
}

export class CreateCaseDto {
  @IsIn(['EMAIL', 'OTHER'])
  declare source: 'EMAIL' | 'OTHER';

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  declare category: string;

  @IsString()
  @MinLength(10)
  @MaxLength(500)
  declare summary: string;

  @IsInt()
  @Min(1)
  @Max(3)
  declare priority: 1 | 2 | 3;

  @IsOptional()
  @IsUUID()
  declare subjectId?: string;
}

export class UpdateCaseDto {
  @IsOptional()
  @IsIn(['OPEN', 'INVESTIGATING', 'CLOSED'])
  declare status?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3)
  declare priority?: number;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsUUID()
  declare handlerId?: string | null;
}

export class AddCaseEntryDto {
  @IsIn(['NOTE', 'CONTACT', 'MEASURE', 'DECISION'])
  declare kind: 'NOTE' | 'CONTACT' | 'MEASURE' | 'DECISION';

  @IsString()
  @MinLength(2)
  @MaxLength(4000)
  declare text: string;
}

export class ApplyRestrictionDto {
  @IsUUID()
  declare userId: string;

  @IsIn(RESTRICTION_TYPES)
  declare type: (typeof RESTRICTION_TYPES)[number];

  @IsString()
  @MinLength(5)
  @MaxLength(500)
  declare reason: string;

  @IsOptional()
  @IsUUID()
  declare protectedUserId?: string;

  @IsOptional()
  @IsUUID()
  declare caseId?: string;

  @IsOptional()
  @IsDateString()
  declare expiresAt?: string;
}
