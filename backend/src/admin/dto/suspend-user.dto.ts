import { IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';

export class SuspendUserDto {
  @IsInt()
  @Min(1)
  @Max(365)
  @IsOptional()
  declare durationDays?: number;

  @IsString()
  @MinLength(3)
  declare reason: string;
}
