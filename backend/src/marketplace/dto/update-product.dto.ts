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
import { ProductStatus, ProductType, VerifiedTier } from '@ile-ase/common';

/**
 * Update Product DTO
 */
export class UpdateProductDto {
  @IsString()
  @MinLength(1)
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsEnum(ProductType)
  @IsOptional()
  type?: ProductType;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  longDescription?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  stock?: number;

  @IsArray()
  @IsUrl({}, { each: true })
  @IsOptional()
  images?: string[];

  @IsString()
  @IsOptional()
  provenance?: string;

  @IsString()
  @IsOptional()
  usageProtocol?: string;

  @IsEnum(ProductStatus)
  @IsOptional()
  status?: ProductStatus;

  @IsEnum(VerifiedTier)
  @IsOptional()
  verifiedTier?: VerifiedTier;

  @IsBoolean()
  @IsOptional()
  taxCompliant?: boolean;
}
