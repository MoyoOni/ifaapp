import { IsString, IsUUID, IsBoolean, IsOptional, MaxLength, MinLength } from 'class-validator';

export class CreatePostDto {
  @IsUUID()
  declare threadId: string;

  @IsString()
  @MinLength(1)
  @MaxLength(10_000)
  declare content: string;

  @IsOptional()
  @IsBoolean()
  declare isAnonymous?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  declare postTag?: string;
}
