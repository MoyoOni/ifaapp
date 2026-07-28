import {
  IsString,
  IsArray,
  IsOptional,
  IsUUID,
  IsNumber,
  Min,
  MinLength,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Bundle Item DTO (nested in CreateBundleDto)
 */
export class BundleItemDto {
  @IsUUID()
  declare productId: string;

  @IsNumber()
  @Min(1)
  declare quantity: number;
}

/**
 * Create Bundle DTO
 * SHOP_BACKLOG.md MSP-002: a vendor proposes a bundle referencing products
 * from any vendor (including their own). Requires elder/admin approval
 * before it's publicly listed.
 */
export class CreateBundleDto {
  @IsString()
  @MinLength(1)
  declare name: string;

  @IsString()
  @IsOptional()
  declare description?: string;

  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => BundleItemDto)
  declare items: BundleItemDto[];
}
