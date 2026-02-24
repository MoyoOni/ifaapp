import { IsString, IsNumber, IsOptional, IsEnum, Min } from 'class-validator';

export class UpdateAppointmentDto {
  @IsString()
  @IsOptional()
  date?: string;

  @IsString()
  @IsOptional()
  time?: string;

  @IsString()
  @IsOptional()
  timezone?: string;

  @IsNumber()
  @IsOptional()
  @Min(15)
  duration?: number;

  @IsEnum(['PENDING', 'UPCOMING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'IN_SESSION'])
  @IsOptional()
  status?: 'PENDING' | 'UPCOMING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'IN_SESSION';

  @IsNumber()
  @IsOptional()
  price?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
