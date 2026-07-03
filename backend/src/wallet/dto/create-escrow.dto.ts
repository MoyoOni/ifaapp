import {
  IsNumber,
  IsString,
  IsOptional,
  Min,
  IsUUID,
  IsEnum,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Currency, EscrowType } from '@ile-ase/common';

export class ReleaseTiersDto {
  @IsNumber()
  @Min(0)
  @IsOptional()
  declare tier1?: number; // Percentage for tier 1 (e.g., 0.5 for 50%)

  @IsNumber()
  @Min(0)
  @IsOptional()
  declare tier2?: number; // Percentage for tier 2 (e.g., 0.5 for 50%)
}

export class CreateEscrowDto {
  @IsUUID()
  @IsOptional()
  declare recipientId?: string;

  @IsNumber()
  @Min(0.01)
  declare amount: number;

  @IsString()
  @IsOptional()
  declare currency?: Currency;

  @IsEnum(EscrowType)
  declare type: EscrowType;

  @IsUUID()
  @IsOptional()
  declare relatedId?: string; // appointmentId, orderId, etc.

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => ReleaseTiersDto)
  declare releaseTiers?: ReleaseTiersDto; // Multi-tier release configuration

  @IsString()
  @IsOptional()
  declare notes?: string;
}
