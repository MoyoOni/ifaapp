import { IsString, IsIn, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateFlagRuleDto {
  @IsString()
  @IsIn(['KEYWORD', 'CATEGORY_MOD'])
  declare type: string;

  @IsString()
  @IsNotEmpty()
  declare value: string;

  @IsString()
  @IsOptional()
  declare reason?: string;
}