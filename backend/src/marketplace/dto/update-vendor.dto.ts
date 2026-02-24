import { IsString, IsOptional, IsEnum } from 'class-validator';
import { VendorStatus } from '@ile-ase/common';

/**
 * Update Vendor DTO
 * Admin-only: Update vendor status (approve, suspend, reject) and cultural authenticity review
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
}
