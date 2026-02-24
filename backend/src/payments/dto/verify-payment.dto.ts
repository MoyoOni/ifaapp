import { IsString } from 'class-validator';

export class VerifyPaymentDto {
  @IsString()
  declare reference: string; // Payment gateway reference
}
