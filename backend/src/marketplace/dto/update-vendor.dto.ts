import { IsString, IsOptional, IsEnum, IsUrl, IsArray, ArrayMaxSize, Matches, MinLength, MaxLength, IsBoolean } from 'class-validator';
import { VendorStatus } from '@ile-ase/common';

/**
 * Update Vendor DTO
 * Admin-only: Update vendor status (approve, suspend, reject) and cultural authenticity review.
 * Vendor-owner fields (description, storefront customisation) are also updated
 * through this DTO -- MarketplaceService.updateVendor already branches on
 * currentUser.role for the admin-only fields above.
 */
export class UpdateVendorDto {
  @IsEnum(VendorStatus)
  @IsOptional()
  status?: VendorStatus;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  culturalAuthenticityNotes?: string; // Admin notes on cultural authenticity review

  @IsString()
  @IsOptional()
  rejectionReason?: string; // If rejected, reason

  // VENDOR_BACKLOG.md VND-016
  @IsUrl()
  @IsOptional()
  bannerImageUrl?: string;

  @IsArray()
  @ArrayMaxSize(3, { message: 'You can feature up to 3 products on your storefront' })
  @IsString({ each: true })
  @IsOptional()
  featuredProductIds?: string[];

  // VENDOR_BACKLOG.md VND-023: custom storefront URL slug, e.g.
  // "oshun-beads-by-adunola". Lowercase letters/digits/hyphens only, matching
  // the same URL-safety convention as User.slug elsewhere in the platform.
  @IsString()
  @MinLength(3)
  @MaxLength(60)
  @Matches(/^[a-z0-9-]+$/, { message: 'Storefront URL can only contain lowercase letters, numbers, and hyphens' })
  @IsOptional()
  slug?: string;

  // VENDOR_BACKLOG.md VND-003: self-reported, shown on the vendor's tax summary
  @IsBoolean()
  @IsOptional()
  vatRegistered?: boolean;

  @IsString()
  @IsOptional()
  vatNumber?: string;
}
