import { IsString, IsOptional, IsArray, IsInt, IsObject, Min, Max, Matches } from 'class-validator';

/**
 * Create Temple DTO
 * NOTE: Temple creation is restricted to Master-tier Babalawos or Advisory Board approval
 */
export class CreateTempleDto {
  @IsString()
  declare name: string;

  @IsOptional()
  @IsString()
  declare yorubaName?: string;

  @IsString()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug must contain only lowercase letters, numbers, and hyphens',
  })
  declare slug: string;

  @IsOptional()
  @IsString()
  declare description?: string;

  @IsOptional()
  @IsString()
  declare history?: string;

  @IsOptional()
  @IsString()
  declare mission?: string;

  // Location
  @IsOptional()
  @IsString()
  declare address?: string;

  @IsOptional()
  @IsString()
  declare city?: string;

  @IsOptional()
  @IsString()
  declare state?: string;

  @IsOptional()
  @IsString()
  declare country?: string;

  @IsOptional()
  @IsString()
  declare location?: string;

  @IsOptional()
  @IsObject()
  declare coordinates?: { lat: number; lng: number };

  // Contact
  @IsOptional()
  @IsString()
  declare phone?: string;

  @IsOptional()
  @IsString()
  declare email?: string;

  @IsOptional()
  @IsString()
  declare website?: string;

  // Visual
  @IsOptional()
  @IsString()
  declare logo?: string;

  @IsOptional()
  @IsString()
  declare bannerImage?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  declare images?: string[];

  // Leadership
  @IsOptional()
  @IsInt()
  @Min(1000)
  @Max(3000)
  declare foundedYear?: number;

  // Temple Type
  @IsString()
  declare type: 'ILE_IFA' | 'BRANCH' | 'STUDY_CIRCLE';

  // Cultural
  @IsOptional()
  @IsString()
  declare lineage?: string;

  @IsOptional()
  @IsString()
  declare tradition?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  declare specialties?: string[];

  // Social Links
  @IsOptional()
  @IsObject()
  declare socialLinks?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
    website?: string;
  };
}
