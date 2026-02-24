import { IsNumber, IsString, IsOptional, IsEnum, Min, IsUUID, IsEmail } from 'class-validator';
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

  @IsUUID()
  @IsOptional()
  relatedId?: string; // orderId, appointmentId, courseId, etc.

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
