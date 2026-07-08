import { IsBoolean, IsDateString, IsOptional } from 'class-validator';

export class UpdateFeaturedDto {
  @IsBoolean()
  declare featured: boolean;

  @IsDateString()
  @IsOptional()
  declare featuredUntil?: string;
}
