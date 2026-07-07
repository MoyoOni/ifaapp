import { IsString, IsDateString, IsOptional, IsNotEmpty, MinLength } from 'class-validator';

export class CreateDailyWordDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  declare word: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  declare pronunciation: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  declare definition: string;

  @IsString()
  @IsOptional()
  declare example?: string;

  @IsString()
  @IsOptional()
  declare culturalContext?: string;

  @IsString()
  @IsOptional()
  declare category?: string;

  @IsDateString()
  @IsNotEmpty()
  declare date: string;
}

export class UpdateDailyWordDto {
  @IsString()
  @IsOptional()
  @MinLength(1)
  declare word?: string;

  @IsString()
  @IsOptional()
  @MinLength(1)
  declare pronunciation?: string;

  @IsString()
  @IsOptional()
  @MinLength(1)
  declare definition?: string;

  @IsString()
  @IsOptional()
  declare example?: string;

  @IsString()
  @IsOptional()
  declare culturalContext?: string;

  @IsString()
  @IsOptional()
  declare category?: string;

  @IsDateString()
  @IsOptional()
  declare date?: string;
}