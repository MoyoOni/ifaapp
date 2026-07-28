import {
  IsString,
  IsNumber,
  IsArray,
  IsOptional,
  IsUUID,
  IsBoolean,
  IsEmail,
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

  // VENDOR_BACKLOG.md VND-007: which specific variant (colour/size/etc
  // combination) was selected, if the product has variants. Optional --
  // a product with no variants is ordered exactly as before this item.
  @IsUUID()
  @IsOptional()
  declare variantId?: string;
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

  // VENDOR_BACKLOG.md VND-011: matched against the vendor's ShippingZone.countries
  @IsString()
  @IsOptional()
  declare shippingCountry?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  declare shippingCost?: number;

  @IsString()
  @IsOptional()
  declare notes?: string;

  // SHOP_BACKLOG.md MSP-024: gifting, via the existing checkout flow
  @IsBoolean()
  @IsOptional()
  declare isGift?: boolean;

  @IsEmail()
  @IsOptional()
  declare giftRecipientEmail?: string;

  @IsString()
  @IsOptional()
  declare giftMessage?: string;

  @IsString()
  @IsOptional()
  declare dedicatedTo?: string;

  // VENDOR_BACKLOG.md VND-020
  @IsString()
  @IsOptional()
  declare promoCode?: string;
}
