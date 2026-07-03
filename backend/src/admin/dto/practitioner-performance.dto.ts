import { IsString, IsNumber, IsDate, IsOptional, IsBoolean, IsEnum } from 'class-validator';

export class PractitionerPerformanceDto {
  @IsString()
  id!: string;

  @IsString()
  name!: string;

  @IsString()
  email!: string;

  @IsNumber()
  totalConsultationsAllTime!: number;

  @IsNumber()
  totalConsultationsThisMonth!: number;

  @IsNumber()
  averageRating!: number;

  @IsNumber()
  totalReviews!: number;

  @IsNumber()
  responseRate!: number;

  @IsNumber()
  noShowRate!: number;

  @IsNumber()
  revenueGenerated!: number;

  @IsNumber()
  daysSinceLastLogin!: number;

  @IsNumber()
  daysSinceLastConsultation!: number;

  @IsEnum(['Active', 'Quiet', 'Inactive', 'At Risk'])
  status!: 'Active' | 'Quiet' | 'Inactive' | 'At Risk';

  @IsOptional()
  lastLoginAt?: Date;

  @IsOptional()
  lastConsultationAt?: Date;
}
