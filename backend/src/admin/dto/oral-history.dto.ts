import {
  IsString,
  IsDateString,
  IsOptional,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  MinLength,
  Equals,
} from 'class-validator';

export class CreateOralHistoryDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  declare title: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  declare category: string;

  @IsString()
  @IsOptional()
  declare babalawoName?: string;

  @IsDateString()
  @IsOptional()
  declare recordingDate?: string;

  @IsArray()
  @IsOptional()
  declare tags?: string[];

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  declare content: string;

  @IsString()
  @IsOptional()
  declare sourceUrl?: string;

  @IsArray()
  @IsOptional()
  declare relatedProductIds?: string[];

  @IsBoolean()
  @IsOptional()
  declare publish?: boolean;
}

// COMMUNITY_BACKLOG.md FOR-024: community-submitted path into the same
// OralHistoryEntry table admins use -- deliberately has no `publish` field,
// since only an admin/elder can toggle a story live (see admin-cultural-content.service.ts).
export class SubmitOralHistoryDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  declare title: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  declare category: string;

  @IsString()
  @IsOptional()
  declare babalawoName?: string;

  @IsDateString()
  @IsOptional()
  declare recordingDate?: string;

  @IsArray()
  @IsOptional()
  declare tags?: string[];

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  declare content: string;

  @IsString()
  @IsOptional()
  declare sourceUrl?: string;

  @IsArray()
  @IsOptional()
  declare relatedProductIds?: string[];

  /**
   * FOR-024: the member agrees to ORAL_HISTORY_LICENCE -- they keep the
   * rights and grant a non-exclusive, non-commercial, withdrawable licence.
   */
  @Equals(true, { message: 'Please agree to the story licence to submit' })
  declare acceptLicence: boolean;
}

export class UpdateOralHistoryDto {
  @IsString()
  @IsOptional()
  @MinLength(1)
  declare title?: string;

  @IsString()
  @IsOptional()
  @MinLength(1)
  declare category?: string;

  @IsString()
  @IsOptional()
  declare babalawoName?: string;

  @IsDateString()
  @IsOptional()
  declare recordingDate?: string;

  @IsArray()
  @IsOptional()
  declare tags?: string[];

  @IsString()
  @IsOptional()
  @MinLength(1)
  declare content?: string;

  @IsString()
  @IsOptional()
  declare sourceUrl?: string;

  @IsArray()
  @IsOptional()
  declare relatedProductIds?: string[];

  @IsBoolean()
  @IsOptional()
  declare publish?: boolean;
}
