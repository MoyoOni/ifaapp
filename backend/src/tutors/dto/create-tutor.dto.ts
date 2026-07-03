import { IsString, IsOptional, IsArray, IsNumber, Min, IsEnum, IsUUID } from 'class-validator';

export enum TeachingStyle {
  INTERACTIVE = 'INTERACTIVE',
  TRADITIONAL = 'TRADITIONAL',
  MODERN = 'MODERN',
  MIXED = 'MIXED',
}

/**
 * Create Tutor DTO
 * Tutor registration for educational services
 */
export class CreateTutorDto {
  @IsString()
  @IsOptional()
  declare businessName?: string;

  @IsEnum(TeachingStyle)
  @IsOptional()
  declare teachingStyle?: TeachingStyle;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  declare languages?: string[];

  @IsNumber()
  @IsOptional()
  declare experience?: number;

  @IsNumber()
  @Min(0)
  declare hourlyRate: number;

  @IsString()
  @IsOptional()
  declare currency?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  declare specialization?: string[];

  @IsString()
  @IsOptional()
  declare availability?: string;

  @IsUUID()
  @IsOptional()
  declare endorsementBy?: string;

  @IsString()
  @IsOptional()
  declare description?: string;
}
