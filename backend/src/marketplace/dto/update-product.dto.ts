import {
  IsString,
  IsNumber,
  IsArray,
  IsBoolean,
  IsOptional,
  MinLength,
  IsEnum,
  IsUrl,
  IsDateString,
  Min,
  ArrayMaxSize,
  MaxLength,
  Matches,
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

  @IsString()
  @IsOptional()
  subcategory?: string;

  @IsBoolean()
  @IsOptional()
  requiresInitiation?: boolean;

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

  // VENDOR_BACKLOG.md VND-018
  @IsString()
  @IsOptional()
  yorubaName?: string;

  @IsString()
  @IsOptional()
  yorubaDescription?: string;

  @IsString()
  @IsOptional()
  pronunciationGuide?: string;

  @IsString()
  @IsOptional()
  traditionalUseContext?: string;

  @IsString()
  @IsOptional()
  regionOfOrigin?: string;

  // SHOP_BACKLOG.md MSP-009: customs declaration details for international
  // orders. HS code: 4 to 10 digits, optionally grouped ("6117.80.10").
  @IsString()
  @IsOptional()
  @MaxLength(200)
  customsDescription?: string;

  @IsOptional()
  @Matches(/^[0-9]{4}([.\s]?[0-9]{2}){0,3}$/, { message: 'hsCode must be a 4-10 digit HS code, e.g. 6117.80' })
  hsCode?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  originCountry?: string;

  // VENDOR_BACKLOG.md VND-023
  @IsString()
  @IsOptional()
  seoTitle?: string;

  @IsString()
  @IsOptional()
  seoDescription?: string;

  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  // VENDOR_BACKLOG.md VND-008
  @IsDateString()
  @IsOptional()
  scheduledAt?: string;

  @IsBoolean()
  @IsOptional()
  showComingSoon?: boolean;

  @IsBoolean()
  @IsOptional()
  isPreOrder?: boolean;

  @IsDateString()
  @IsOptional()
  expectedDeliveryDate?: string;

  // VENDOR_BACKLOG.md VND-005
  @IsNumber()
  @Min(0)
  @IsOptional()
  lowStockThreshold?: number;

  @IsBoolean()
  @IsOptional()
  isMadeToOrder?: boolean;

  @IsString()
  @IsOptional()
  madeToOrderProcessingTime?: string;

  // VENDOR_BACKLOG.md VND-025
  @IsBoolean()
  @IsOptional()
  wholesaleEnabled?: boolean;

  @IsNumber()
  @Min(2)
  @IsOptional()
  wholesaleMinQuantity?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  wholesalePrice?: number;
}
