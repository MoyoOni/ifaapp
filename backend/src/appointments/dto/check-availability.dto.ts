import { IsString, IsISO8601 } from 'class-validator';

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
}
