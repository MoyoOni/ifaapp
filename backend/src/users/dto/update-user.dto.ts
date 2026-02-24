import { IsString, IsOptional, IsEnum, IsArray, MinLength, IsNumber, IsUrl } from 'class-validator';
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
}
