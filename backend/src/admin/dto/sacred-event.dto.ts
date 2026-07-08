import {
  IsString,
  IsDateString,
  IsOptional,
  IsNotEmpty,
  IsBoolean,
  MinLength,
} from 'class-validator';

export class CreateSacredEventDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  declare title: string;

  @IsString()
  @IsOptional()
  declare yorubaName?: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  declare description: string;

  @IsDateString()
  @IsNotEmpty()
  declare date: string;

  @IsDateString()
  @IsOptional()
  declare endDate?: string;

  @IsString()
  @IsOptional()
  declare type?: string;

  @IsString()
  @IsOptional()
  declare bannerColor?: string;

  @IsBoolean()
  @IsOptional()
  declare isActive?: boolean;
}

export class UpdateSacredEventDto {
  @IsString()
  @IsOptional()
  @MinLength(1)
  declare title?: string;

  @IsString()
  @IsOptional()
  declare yorubaName?: string;

  @IsString()
  @IsOptional()
  @MinLength(1)
  declare description?: string;

  @IsDateString()
  @IsOptional()
  declare date?: string;

  @IsDateString()
  @IsOptional()
  declare endDate?: string;

  @IsString()
  @IsOptional()
  declare type?: string;

  @IsString()
  @IsOptional()
  declare bannerColor?: string;

  @IsBoolean()
  @IsOptional()
  declare isActive?: boolean;
}
