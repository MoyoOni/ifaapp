import {
  IsString,
  IsDateString,
  IsOptional,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  MinLength,
} from 'class-validator';

export class CreateOralHistoryDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  declare title: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  declare category: string;

  @IsString()
  @IsOptional()
  declare babalawoName?: string;

  @IsDateString()
  @IsOptional()
  declare recordingDate?: string;

  @IsArray()
  @IsOptional()
  declare tags?: string[];

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  declare content: string;

  @IsString()
  @IsOptional()
  declare sourceUrl?: string;

  @IsBoolean()
  @IsOptional()
  declare publish?: boolean;
}

export class UpdateOralHistoryDto {
  @IsString()
  @IsOptional()
  @MinLength(1)
  declare title?: string;

  @IsString()
  @IsOptional()
  @MinLength(1)
  declare category?: string;

  @IsString()
  @IsOptional()
  declare babalawoName?: string;

  @IsDateString()
  @IsOptional()
  declare recordingDate?: string;

  @IsArray()
  @IsOptional()
  declare tags?: string[];

  @IsString()
  @IsOptional()
  @MinLength(1)
  declare content?: string;

  @IsString()
  @IsOptional()
  declare sourceUrl?: string;

  @IsBoolean()
  @IsOptional()
  declare publish?: boolean;
}
