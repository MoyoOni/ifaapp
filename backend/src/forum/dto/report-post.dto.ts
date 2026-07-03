import { IsOptional, IsString, MinLength } from 'class-validator';

export class ReportPostDto {
  @IsString()
  @MinLength(3)
  declare reason: string;

  @IsString()
  @IsOptional()
  declare note?: string;
}
