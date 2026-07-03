import { IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  declare name: string;

  @IsString()
  declare slug: string; // URL-friendly identifier

  @IsString()
  @IsOptional()
  declare description?: string;

  @IsString()
  @IsOptional()
  declare icon?: string; // Icon identifier or emoji

  @IsNumber()
  @IsOptional()
  declare order?: number;

  @IsBoolean()
  @IsOptional()
  declare isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  declare isTeachings?: boolean; // Cultural teachings section (read-only)
}
