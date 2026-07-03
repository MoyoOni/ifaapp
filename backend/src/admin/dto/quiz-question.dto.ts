import { IsArray, IsBoolean, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateQuizQuestionDto {
  @IsString()
  declare questionText: string;

  @IsArray()
  @IsString({ each: true })
  declare options: string[];

  @IsInt()
  @Min(0)
  declare correctIndex: number;

  @IsInt()
  @IsOptional()
  declare sortOrder?: number;
}

export class UpdateQuizQuestionDto {
  @IsString()
  @IsOptional()
  declare questionText?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  declare options?: string[];

  @IsInt()
  @Min(0)
  @IsOptional()
  declare correctIndex?: number;

  @IsInt()
  @IsOptional()
  declare sortOrder?: number;

  @IsBoolean()
  @IsOptional()
  declare isActive?: boolean;
}

export class UpdateQuizThresholdDto {
  @IsInt()
  @Min(1)
  declare threshold: number;
}
