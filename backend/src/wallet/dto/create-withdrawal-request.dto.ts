import { IsNumber, IsString, IsOptional, Min, IsUUID } from 'class-validator';
import { Currency } from '@ile-ase/common';

export class CreateWithdrawalRequestDto {
  @IsNumber()
  @Min(0.01)
  declare amount: number;

  @IsString()
  @IsOptional()
  declare currency?: Currency;

  @IsString()
  @IsOptional()
  declare bankAccount?: string;

  @IsString()
  @IsOptional()
  declare bankName?: string;

  @IsString()
  @IsOptional()
  declare accountName?: string;

  @IsUUID()
  @IsOptional()
  declare escrowId?: string; // If withdrawing from specific escrow
}
