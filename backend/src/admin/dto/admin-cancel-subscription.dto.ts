import { IsOptional, IsString } from 'class-validator';

export class AdminCancelSubscriptionDto {
  @IsString()
  @IsOptional()
  declare reason?: string;
}
