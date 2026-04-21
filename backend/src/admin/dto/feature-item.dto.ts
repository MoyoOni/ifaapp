import { IsDateString, IsOptional } from 'class-validator';

export class FeatureItemDto {
  @IsDateString()
  @IsOptional()
  declare featuredUntil: string | null;
}
