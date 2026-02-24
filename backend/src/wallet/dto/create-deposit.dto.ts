import { IsNumber, IsString, IsOptional, Min } from 'class-validator';
import { Currency } from '@ile-ase/common';

export class CreateDepositDto {
  @IsNumber()
  @Min(0.01)
  declare amount: number;

  @IsString()
  @IsOptional()
  declare currency?: Currency;

  @IsString()
  @IsOptional()
  declare reference?: string; // Payment gateway reference
}
