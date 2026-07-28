import { IsString, IsArray, IsOptional, IsNumber, IsBoolean, IsIn, Min, Max, ArrayMinSize } from 'class-validator';

export const SHIPPING_RATE_TYPES = ['FREE', 'FLAT', 'WEIGHT_BASED'] as const;

export class CreateShippingZoneDto {
  @IsString()
  declare name: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  declare countries: string[];

  @IsIn(SHIPPING_RATE_TYPES)
  declare rateType: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  declare flatRate?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  declare perKgRate?: number;

  @IsString()
  @IsOptional()
  declare processingTime?: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  declare combinedShippingDiscountPct?: number;

  @IsBoolean()
  @IsOptional()
  declare isDefault?: boolean;
}

export class UpdateShippingZoneDto {
  @IsString()
  @IsOptional()
  declare name?: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @IsOptional()
  declare countries?: string[];

  @IsIn(SHIPPING_RATE_TYPES)
  @IsOptional()
  declare rateType?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  declare flatRate?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  declare perKgRate?: number;

  @IsString()
  @IsOptional()
  declare processingTime?: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  declare combinedShippingDiscountPct?: number;

  @IsBoolean()
  @IsOptional()
  declare isDefault?: boolean;
}
