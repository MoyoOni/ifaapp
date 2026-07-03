import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { VerificationStage, VerificationTier } from '@ile-ase/common';

export class ApproveVerificationDto {
  @IsEnum(VerificationStage)
  declare currentStage: VerificationStage;

  @IsEnum(VerificationTier)
  @IsOptional()
  declare tier?: VerificationTier;

  @IsBoolean()
  declare approved: boolean; // true to approve, false to reject

  @IsString()
  @IsOptional()
  declare notes?: string; // Admin notes for approval/rejection

  @IsString()
  @IsOptional()
  declare reason?: string; // Reason for rejection
}
