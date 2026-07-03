import {
  IsString,
  IsNumber,
  IsArray,
  IsOptional,
  IsUUID,
  Min,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Order Item DTO (nested in CreateOrderDto)
 */
export class OrderItemDto {
  @IsUUID()
  declare productId: string;

  @IsNumber()
  @Min(1)
  declare quantity: number;
}

/**
 * Create Order DTO
 * Customer order creation
 */
export class CreateOrderDto {
  @IsUUID()
  declare vendorId: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  declare items: OrderItemDto[];

  @IsString()
  @IsOptional()
  declare shippingAddress?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  declare shippingCost?: number;

  @IsString()
  @IsOptional()
  declare notes?: string;
}
