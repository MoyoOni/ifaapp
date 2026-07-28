import { IsNumber, IsString, IsOptional, IsEnum, Min } from 'class-validator';
import { Currency, PaymentPurpose } from '@ile-ase/common';

export class InitializePaymentDto {
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsEnum(Currency)
  currency!: Currency;

  @IsEnum(PaymentPurpose)
  purpose!: PaymentPurpose;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  name?: string;

  // Was @IsUUID(), which rejected marketplace checkout's comma-joined
  // multi-order id (one Payment can cover several vendors' orders at once --
  // see PaymentsService.processMarketplaceOrderPayment). A single UUID is
  // still valid here, so this only widens acceptance.
  @IsString()
  @IsOptional()
  relatedId?: string; // orderId, appointmentId, courseId, or a comma-joined list of order ids

  @IsString()
  @IsOptional()
  callbackUrl?: string;

  @IsString()
  @IsOptional()
  metadata?: string; // JSON string for additional data

  @IsString()
  @IsOptional()
  preferredProvider?: string; // PAYSTACK or FLUTTERWAVE - user preference override
}
