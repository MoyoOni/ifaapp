import { IsString, IsOptional, IsBoolean, MinLength } from 'class-validator';

export class CreateMemorialDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsString()
  @IsOptional()
  relationship?: string;

  @IsString()
  @MinLength(1)
  message!: string;

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}
