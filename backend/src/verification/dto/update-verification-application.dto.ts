import { IsString, IsEnum, IsOptional } from 'class-validator';
import { VerificationStage, VerificationTier } from '@ile-ase/common';

export class UpdateVerificationApplicationDto {
  @IsEnum(VerificationStage)
  @IsOptional()
  declare currentStage?: VerificationStage;

  @IsEnum(VerificationTier)
  @IsOptional()
  declare tier?: VerificationTier;

  @IsString()
  @IsOptional()
  declare reviewerId?: string;

  @IsString()
  @IsOptional()
  declare notes?: string;

  @IsEnum(['PENDING', 'APPROVED', 'REJECTED'])
  @IsOptional()
  declare status?: 'PENDING' | 'APPROVED' | 'REJECTED';
}
