import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class ReviewBundleDto {
  @IsBoolean()
  declare approved: boolean;

  @IsString()
  @IsOptional()
  declare rejectionReason?: string;
}
