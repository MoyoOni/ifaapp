import { IsString, IsOptional, IsEnum, IsUrl } from 'class-validator';
import { OrderStatus } from '@ile-ase/common';

/**
 * Update Order DTO
 * For vendors to update order status and tracking information
 */
export class UpdateOrderDto {
  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;

  @IsString()
  @IsOptional()
  trackingNumber?: string;

  @IsString()
  @IsOptional()
  carrier?: string;

  @IsUrl()
  @IsOptional()
  trackingUrl?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  // VENDOR_BACKLOG.md VND-009: vendor-only, never shown to the customer
  @IsString()
  @IsOptional()
  vendorNotes?: string;
}
