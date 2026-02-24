import { IsEnum, IsString, IsOptional, MinLength, IsNumber } from 'class-validator';

export enum ResolutionType {
  ACCEPT_CLIENT = 'ACCEPT_CLIENT',
  ACCEPT_PRACTITIONER = 'ACCEPT_PRACTITIONER',
  PARTIAL_REFUND = 'PARTIAL_REFUND',
  FULL_REFUND = 'FULL_REFUND',
  REFUND = 'REFUND',
  OTHER = 'OTHER',
}

export class ResolveDisputeDto {
  @IsEnum(ResolutionType)
  declare resolution: ResolutionType;

  @IsNumber()
  @IsOptional()
  declare amount?: number;

  @IsString()
  @MinLength(10)
  @IsOptional()
  declare resolutionNotes?: string;

  @IsString()
  @IsOptional()
  declare adminNotes?: string;
}
