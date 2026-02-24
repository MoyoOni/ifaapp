import { IsString, IsOptional, IsArray, IsEnum, IsBoolean, MaxLength } from 'class-validator';
import { CirclePrivacy } from './create-circle.dto';

export class UpdateCircleDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsEnum(CirclePrivacy)
  @IsOptional()
  privacy?: CirclePrivacy;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  topics?: string[];

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  avatar?: string;

  @IsString()
  @IsOptional()
  banner?: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
