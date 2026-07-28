import { IsArray, IsBoolean, IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';

export enum PromotionType {
  DISCOUNT_CODE = 'DISCOUNT_CODE',
  FLASH_SALE = 'FLASH_SALE',
  VOLUME_DISCOUNT = 'VOLUME_DISCOUNT',
  BUNDLE_DEAL = 'BUNDLE_DEAL',
  WELCOME_DISCOUNT = 'WELCOME_DISCOUNT',
}

export enum PromotionDiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
}

export class CreateVendorPromotionDto {
  @IsEnum(PromotionType)
  declare type: PromotionType;

  @IsString()
  @MinLength(3)
  declare name: string;

  // Required for DISCOUNT_CODE only -- validated in the service since it
  // depends on `type`.
  @IsString()
  @IsOptional()
  code?: string;

  @IsEnum(PromotionDiscountType)
  @IsOptional()
  discountType?: PromotionDiscountType;

  @IsNumber()
  @Min(0)
  declare value: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  maxUses?: number;

  @IsDateString()
  @IsOptional()
  startsAt?: string;

  @IsDateString()
  @IsOptional()
  expiresAt?: string;

  // DISCOUNT_CODE / WELCOME_DISCOUNT: empty/omitted = every product
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  eligibleProductIds?: string[];

  // FLASH_SALE / VOLUME_DISCOUNT / BUNDLE_DEAL
  @IsString()
  @IsOptional()
  productId?: string;

  // VOLUME_DISCOUNT
  @IsInt()
  @Min(2)
  @IsOptional()
  minQuantity?: number;

  // BUNDLE_DEAL
  @IsString()
  @IsOptional()
  bundleProductId?: string;
}

export class UpdateVendorPromotionDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  value?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  maxUses?: number;

  @IsDateString()
  @IsOptional()
  expiresAt?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
