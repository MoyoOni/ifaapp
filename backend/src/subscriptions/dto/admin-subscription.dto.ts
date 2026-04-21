import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export class AdminGrantSubscriptionDto {
  @IsUUID()
  declare userId: string;

  @IsEnum(['QUARTERLY', 'ANNUAL'])
  declare plan: 'QUARTERLY' | 'ANNUAL';

  @IsString()
  @IsOptional()
  declare reason?: string;
}

export class WinBackDto {
  @IsUUID()
  declare userId: string;
}
