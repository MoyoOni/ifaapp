import {
  IsString,
  IsUUID,
  IsBoolean,
  IsOptional,
  IsArray,
  ArrayMaxSize,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateThreadDto {
  @IsUUID()
  declare categoryId: string;

  @IsString()
  @MinLength(5)
  @MaxLength(250)
  declare title: string;

  @IsString()
  @MinLength(10)
  @MaxLength(20_000)
  declare content: string; // First post content

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  @ArrayMaxSize(5)
  declare tags?: string[];

  @IsBoolean()
  @IsOptional()
  declare isApproved?: boolean; // False requires moderator approval

  @IsBoolean()
  @IsOptional()
  declare isSacred?: boolean; // Sacred Knowledge tag
}
