import { IsString, IsOptional, IsBoolean, MinLength } from 'class-validator';

export class AwardBadgeDto {
  @IsString()
  @MinLength(1)
  declare badgeName: string;

  @IsString()
  @MinLength(1)
  declare badgeSlug: string;

  @IsOptional()
  @IsString()
  declare description?: string;

  @IsOptional()
  @IsString()
  declare message?: string;

  @IsOptional()
  @IsBoolean()
  declare promoteToBuilder?: boolean;
}