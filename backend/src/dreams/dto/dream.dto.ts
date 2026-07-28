import { IsString, IsOptional, IsBoolean, MinLength } from 'class-validator';

export class CreateDreamDto {
  @IsString()
  @MinLength(1)
  content!: string;

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @IsBoolean()
  @IsOptional()
  interpretationRequested?: boolean;
}

export class InterpretDreamDto {
  @IsString()
  @MinLength(1)
  interpretation!: string;
}
