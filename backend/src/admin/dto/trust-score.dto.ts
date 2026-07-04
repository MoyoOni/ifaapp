import { IsString, IsNumber, IsOptional } from 'class-validator';

export class UpdateTrustScoreDto {
  @IsString()
  userId!: string;

  @IsNumber()
  @IsOptional()
  trustScoreOverride?: number;

  @IsString()
  @IsOptional()
  trustScoreOverrideReason?: string;

  @IsString()
  @IsOptional()
  tierOverride?: string;
}
