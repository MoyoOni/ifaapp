import {
  IsString,
  IsNumber,
  IsArray,
  IsBoolean,
  IsOptional,
  MinLength,
  IsEnum,
  IsUrl,
  Min,
  ArrayMinSize,
} from 'class-validator';
import { ProductType, VerifiedTier } from '@ile-ase/common';

/**
 * Create Product DTO
 * Product listing creation
 */
export class CreateProductDto {
  @IsString()
  @MinLength(1)
  declare name: string;

  @IsString()
  @MinLength(1)
  declare category: string; // sacred-ritual, education, apparel, art-decor, cultural-lifestyle, premium-collector, gift-bundles, digital

  @IsString()
  @IsOptional()
  declare subcategory?: string; // e.g. divination-tools, beads-jewelry

  @IsEnum(ProductType)
  @IsOptional()
  declare type?: ProductType;

  @IsString()
  @MinLength(1)
  declare description: string;

  @IsString()
  @IsOptional()
  declare longDescription?: string;

  @IsNumber()
  @Min(0)
  declare price: number;

  @IsString()
  @IsOptional()
  declare currency?: string; // Default: NGN

  @IsNumber()
  @Min(0)
  @IsOptional()
  declare stock?: number; // null for digital/services

  @IsArray()
  @ArrayMinSize(1)
  @IsUrl({}, { each: true })
  declare images: string[]; // Array of image URLs

  @IsString()
  @IsOptional()
  declare provenance?: string; // Origin/authenticity information

  @IsString()
  @IsOptional()
  declare usageProtocol?: string; // Instructions for use (culturally appropriate)

  @IsEnum(VerifiedTier)
  @IsOptional()
  declare verifiedTier?: VerifiedTier;

  @IsBoolean()
  @IsOptional()
  declare requiresInitiation?: boolean; // Gate for initiated practitioners only

  @IsBoolean()
  @IsOptional()
  declare taxCompliant?: boolean; // VAT compliance status
}
