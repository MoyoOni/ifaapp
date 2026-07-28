import { IsInt, IsNumber, IsObject, IsOptional, IsString, Min } from 'class-validator';

export class CreateProductVariantDto {
  // e.g. { "Colour": "Yellow", "Size": "Medium" } -- at most 3 keys,
  // enforced in the service (matches VENDOR_BACKLOG.md VND-007's "up to 3
  // variant types" limit).
  @IsObject()
  declare attributes: Record<string, string>;

  @IsString()
  @IsOptional()
  sku?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  priceOverride?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  stock?: number;
}

export class UpdateProductVariantDto {
  @IsObject()
  @IsOptional()
  attributes?: Record<string, string>;

  @IsString()
  @IsOptional()
  sku?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  priceOverride?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  stock?: number;
}
