import { IsString, IsOptional, IsArray, IsEnum, MinLength, MaxLength } from 'class-validator';

export enum CirclePrivacy {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  INVITE_ONLY = 'INVITE_ONLY',
}

export class CreateCircleDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  declare name: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  declare description?: string;

  @IsEnum(CirclePrivacy)
  @IsOptional()
  declare privacy?: CirclePrivacy;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  declare topics?: string[];

  @IsString()
  @IsOptional()
  declare location?: string;

  @IsString()
  @IsOptional()
  declare avatar?: string;

  @IsString()
  @IsOptional()
  declare banner?: string;
}
