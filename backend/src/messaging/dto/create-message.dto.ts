import {
  IsString,
  IsUUID,
  MinLength,
  MaxLength,
  IsOptional,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
} from 'class-validator';
import { PrivacyLevel } from '@ile-ase/common';

export class CreateMessageDto {
  @IsUUID()
  declare receiverId: string;

  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  declare content: string; // Plain text, will be encrypted server-side

  @IsArray()
  @IsOptional()
  declare attachments?: any[]; // Array of attachment objects { id, url, type, name, size }

  // Privacy controls
  @IsBoolean()
  @IsOptional()
  declare confidential?: boolean; // Confidential session flag

  @IsEnum(PrivacyLevel)
  @IsOptional()
  declare privacyLevel?: PrivacyLevel; // Privacy level (default: PRIVATE)

  @IsInt()
  @IsOptional()
  declare autoDeleteDays?: number; // Auto-delete after X days (7, 30, 90, or null)
}
