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
}
