import { IsArray, IsString, IsOptional, IsEnum, IsNumber, ArrayMinSize, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ProductStatus } from '@ile-ase/common';

export enum PriceAdjustmentMode {
  PERCENT = 'PERCENT', // value is +/- percent, e.g. 10 = +10%, -10 = -10%
  FIXED_AMOUNT = 'FIXED_AMOUNT', // value is +/- amount added to the current price
  SET_PRICE = 'SET_PRICE', // value is the exact new price for every selected product
}

export class PriceAdjustmentDto {
  @IsEnum(PriceAdjustmentMode)
  declare mode: PriceAdjustmentMode;

  @IsNumber()
  declare value: number;
}

export enum StockAdjustmentMode {
  ADD = 'ADD', // "Bulk restock: select multiple products, add quantity"
  SET = 'SET', // set every selected product's stock to the exact same value
}

export class StockAdjustmentDto {
  @IsEnum(StockAdjustmentMode)
  declare mode: StockAdjustmentMode;

  @IsNumber()
  declare value: number;
}

// VENDOR_BACKLOG.md VND-006: only DRAFT/ACTIVE are offered in bulk (same
// vendor-self-service scope as the single-product update in VND-008) --
// SUSPENDED stays an individual admin moderation action, not something a
// vendor can sweep across their whole catalogue.
export class BulkUpdateProductsDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  declare productIds: string[];

  @IsEnum(ProductStatus)
  @IsOptional()
  declare status?: ProductStatus;

  @IsString()
  @IsOptional()
  declare category?: string;

  @ValidateNested()
  @Type(() => PriceAdjustmentDto)
  @IsOptional()
  declare priceAdjustment?: PriceAdjustmentDto;

  // VENDOR_BACKLOG.md VND-005
  @ValidateNested()
  @Type(() => StockAdjustmentDto)
  @IsOptional()
  declare stockAdjustment?: StockAdjustmentDto;
}
