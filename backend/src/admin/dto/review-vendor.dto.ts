import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class ReviewVendorDto {
  @IsBoolean()
  declare approved: boolean;

  @IsString()
  @IsOptional()
  declare culturalAuthenticityNotes?: string;

  @IsString()
  @IsOptional()
  declare rejectionReason?: string;
}
