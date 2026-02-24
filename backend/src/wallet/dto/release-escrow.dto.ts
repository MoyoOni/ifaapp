import { IsString, IsOptional, IsUUID, IsNumber, IsEnum, Min, Max } from 'class-validator';

export enum ReleaseTier {
  TIER_1 = 'TIER_1',
  TIER_2 = 'TIER_2',
  FULL = 'FULL', // Release remaining amount
}

export class ReleaseEscrowDto {
  @IsUUID()
  declare escrowId: string;

  @IsEnum(ReleaseTier)
  @IsOptional()
  declare tier?: ReleaseTier; // Which tier to release (for multi-tier escrows)

  @IsNumber()
  @Min(0.01)
  @IsOptional()
  declare amount?: number; // Custom amount to release (optional, uses tier if not provided)

  @IsString()
  @IsOptional()
  declare notes?: string;
}
