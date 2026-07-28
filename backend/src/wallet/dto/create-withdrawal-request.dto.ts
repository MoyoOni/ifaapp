import { IsNumber, IsString, IsOptional, Min, IsUUID } from 'class-validator';
import { Currency } from '@ile-ase/common';

export class CreateWithdrawalRequestDto {
  @IsNumber()
  @Min(0.01)
  declare amount: number;

  @IsString()
  @IsOptional()
  declare currency?: Currency;

  // VENDOR_BACKLOG.md VND-002: pass a saved BankAccount id instead of
  // retyping bank details every time. When provided, the service uses that
  // record's fields and the four below are ignored; when omitted, all four
  // below are required (enforced in the service, not here -- conditionally
  // required fields across two mutually-exclusive paths don't map cleanly
  // onto per-field class-validator decorators).
  @IsUUID()
  @IsOptional()
  declare bankAccountId?: string;

  @IsString()
  @IsOptional()
  declare bankAccount?: string;

  @IsString()
  @IsOptional()
  declare bankName?: string;

  // HUMAN_BACKLOG.md: Paystack's transfer recipient API needs the bank's
  // numeric code (e.g. "058"), not its display name -- fetch the real list
  // from GET /payments/banks and have the user pick from it, don't invent one.
  @IsString()
  @IsOptional()
  declare bankCode?: string;

  @IsString()
  @IsOptional()
  declare accountName?: string;

  @IsUUID()
  @IsOptional()
  declare escrowId?: string; // If withdrawing from specific escrow
}
