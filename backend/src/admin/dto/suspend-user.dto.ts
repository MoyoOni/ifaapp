import { IsNumber, IsString, IsOptional, Min, Max } from 'class-validator';

export class SuspendUserDto {
  @IsNumber()
  @Min(1)
  @Max(365)
  durationDays!: number;

  @IsOptional()
  @IsString()
  reason?: string;
}
