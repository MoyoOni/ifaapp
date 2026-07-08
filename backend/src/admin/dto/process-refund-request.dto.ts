import { IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class ProcessRefundRequestDto {
  @IsIn(['approve', 'reject'])
  declare action: 'approve' | 'reject';

  @IsNumber()
  @Min(0.01)
  @IsOptional()
  declare approvedAmount?: number;

  @IsString()
  @IsOptional()
  declare adminNote?: string;
}
