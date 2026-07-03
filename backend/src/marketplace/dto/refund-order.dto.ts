import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class RefundOrderDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  refundAmount?: number;

  @IsOptional()
  @IsString()
  refundReason?: string;
}
