import { IsArray, IsOptional, IsString, MinLength } from 'class-validator';

export class SaveTemplateDto {
  @IsString()
  @MinLength(2)
  declare name: string;

  @IsString()
  declare type: string;

  @IsArray()
  declare items: unknown[];

  @IsString()
  @IsOptional()
  declare instructions?: string;

  @IsString()
  @IsOptional()
  declare notes?: string;
}
