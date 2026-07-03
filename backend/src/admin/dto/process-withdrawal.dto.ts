import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class ProcessWithdrawalDto {
  @IsBoolean()
  declare approve: boolean;

  @IsString()
  @IsOptional()
  declare notes?: string;
}
