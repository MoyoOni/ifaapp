import { IsNumber, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';

export class TrustScoreOverrideDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  declare override: number | null;

  @IsString()
  @MinLength(5)
  declare reason: string;
}
