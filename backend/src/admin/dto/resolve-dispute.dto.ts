import { IsString, IsOptional, IsEnum, IsNumber, Min } from 'class-validator';

export enum DisputeResolution {
  REFUND_CLIENT = 'REFUND_CLIENT',
  PAY_PROVIDER = 'PAY_PROVIDER',
  PARTIAL_REFUND = 'PARTIAL_REFUND',
  REJECT = 'REJECT',
}

export class ResolveDisputeDto {
  @IsEnum(DisputeResolution)
  declare resolution: DisputeResolution;

  @IsNumber()
  @Min(0)
  @IsOptional()
  declare refundAmount?: number; // Required for PARTIAL_REFUND

  @IsString()
  @IsOptional()
  declare notes?: string; // Admin notes explaining resolution
}
