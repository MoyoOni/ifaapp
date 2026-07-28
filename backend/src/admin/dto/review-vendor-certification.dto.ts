import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class ReviewVendorCertificationDto {
  @IsBoolean()
  declare approved: boolean;

  @IsString()
  @IsOptional()
  declare declineReason?: string;
}
