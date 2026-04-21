import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class TipPostDto {
  @IsNumber()
  @Min(1)
  declare amount: number;

  @IsString()
  @IsOptional()
  declare currency?: string;
}
