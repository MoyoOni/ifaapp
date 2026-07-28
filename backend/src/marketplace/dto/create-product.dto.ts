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
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { ProductType, ProductStatus, VerifiedTier } from '@ile-ase/common';

// VENDOR_BACKLOG.md VND-008: only these two make sense to hand-pick at
// creation time. ARCHIVED/OUT_OF_STOCK/SUSPENDED are outcomes of later
// lifecycle events (vendor archiving, stock depleting, admin moderation),
// not something you'd ever choose when first listing a product.
export const CREATABLE_PRODUCT_STATUSES = [ProductStatus.DRAFT, ProductStatus.ACTIVE] as const;

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

  // VENDOR_BACKLOG.md VND-018: Yoruba language listing fields, all optional
  @IsString()
  @IsOptional()
  declare yorubaName?: string;

  @IsString()
  @IsOptional()
  declare yorubaDescription?: string;

  @IsString()
  @IsOptional()
  declare pronunciationGuide?: string;

  @IsString()
  @IsOptional()
  declare traditionalUseContext?: string;

  @IsString()
  @IsOptional()
  declare regionOfOrigin?: string;

  // VENDOR_BACKLOG.md VND-023
  @IsString()
  @IsOptional()
  declare seoTitle?: string;

  @IsString()
  @IsOptional()
  declare seoDescription?: string;

  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @IsOptional()
  declare tags?: string[];

  // VENDOR_BACKLOG.md VND-008
  @IsEnum(ProductStatus)
  @IsOptional()
  declare status?: ProductStatus;

  @IsDateString()
  @IsOptional()
  declare scheduledAt?: string;

  @IsBoolean()
  @IsOptional()
  declare showComingSoon?: boolean;

  @IsBoolean()
  @IsOptional()
  declare isPreOrder?: boolean;

  @IsDateString()
  @IsOptional()
  declare expectedDeliveryDate?: string;

  // VENDOR_BACKLOG.md VND-005
  @IsNumber()
  @Min(0)
  @IsOptional()
  declare lowStockThreshold?: number;

  @IsBoolean()
  @IsOptional()
  declare isMadeToOrder?: boolean;

  @IsString()
  @IsOptional()
  declare madeToOrderProcessingTime?: string;
}
