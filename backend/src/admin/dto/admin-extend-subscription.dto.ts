import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class AdminExtendSubscriptionDto {
  @IsInt()
  @Min(1)
  @Max(24)
  declare months: number;

  @IsString()
  @IsOptional()
  declare reason?: string;
}
