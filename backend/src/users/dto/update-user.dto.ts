import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  MinLength,
  IsNumber,
  IsUrl,
  IsBoolean,
  Matches,
  ValidateIf,
} from 'class-validator';
import { CulturalLevel } from '@ile-ase/common';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  @MinLength(1)
  name?: string;

  @IsString()
  @IsOptional()
  yorubaName?: string;

  @IsUrl()
  @IsOptional()
  avatar?: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsString()
  @IsOptional()
  aboutMe?: string;

  @IsString()
  @IsOptional()
  gender?: string; // Optional, privacy-controlled

  @IsNumber()
  @IsOptional()
  age?: number; // Optional, privacy-controlled

  @IsString()
  @IsOptional()
  location?: string;

  @IsEnum(CulturalLevel)
  @IsOptional()
  culturalLevel?: CulturalLevel;

  @IsString()
  @IsOptional()
  dialectPreference?: string;

  @IsString()
  @IsOptional()
  themeColor?: string;

  @IsEnum(['public', 'private', 'community'])
  @IsOptional()
  profileVisibility?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  interests?: string[];

  // COMMUNITY_BACKLOG.md FOR-Q2: opt-in to the member directory
  @IsBoolean()
  @IsOptional()
  showInDirectory?: boolean;

  // COMMUNITY_BACKLOG.md FOR-Q3: opt-in to answer Seeker Questions
  @IsBoolean()
  @IsOptional()
  answersElderQuestions?: boolean;

  // COMMUNITY_BACKLOG.md FOR-014: self-editable elder profile fields --
  // the frontend already read `specialization` expecting it to exist; it
  // never did. This makes that already-built display section real.
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  specialization?: string[];

  @IsString()
  @IsOptional()
  availabilityNote?: string;

  @IsString()
  @IsOptional()
  @Matches(/^[a-z0-9-]{3,30}$/, {
    message: 'Slug must be 3-30 lowercase letters, numbers, or hyphens',
  })
  slug?: string;

  @IsString()
  @IsOptional()
  whatsappNumber?: string;

  @IsBoolean()
  @IsOptional()
  whatsappEnabled?: boolean;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  personalAwoId?: string | null;

  @IsOptional()
  availability?: unknown;
}
