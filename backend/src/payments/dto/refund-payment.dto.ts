import { IsString, IsOptional, IsEnum, IsNumber, Min } from 'class-validator';
import { PaymentProvider } from '../payments.service';

export enum CancellationReason {
  BABALAWO_CANCELLED = 'BABALAWO_CANCELLED',
  USER_CANCELLED = 'USER_CANCELLED',
  SERVICE_NOT_COMPLETED = 'SERVICE_NOT_COMPLETED',
  DISPUTE_RESOLUTION = 'DISPUTE_RESOLUTION',
  TECHNICAL_ISSUE = 'TECHNICAL_ISSUE',
  OTHER = 'OTHER',
}

export class RefundPaymentDto {
  @IsString()
  reference!: string;

  @IsNumber()
  @Min(0.01)
  @IsOptional()
  amount?: number; // Partial refund amount (optional)

  @IsEnum(PaymentProvider)
  @IsOptional()
  provider?: PaymentProvider;

  @IsEnum(CancellationReason)
  @IsOptional()
  cancellationReason?: CancellationReason;

  @IsString()
  @IsOptional()
  notes?: string;
}
