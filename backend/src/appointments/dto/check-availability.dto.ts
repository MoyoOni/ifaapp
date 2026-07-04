import { IsString, IsISO8601, IsOptional } from 'class-validator';

export class CheckAvailabilityDto {
  @IsString()
  babalawoId!: string;

  @IsString()
  @IsISO8601()
  date!: string;

  @IsString()
  time!: string;

  @IsString()
  duration?: string; // Optional duration in minutes

  @IsString()
  @IsOptional()
  timezone?: string; // Defaults to Africa/Lagos (WAT) — P2-03
}
