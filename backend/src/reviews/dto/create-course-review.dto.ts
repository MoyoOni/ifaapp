import { IsString, IsOptional, IsInt, Min, Max, MaxLength } from 'class-validator';

export class CreateCourseReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  declare rating: number;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  declare title?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  declare content?: string;

  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(5)
  declare contentQualityRating?: number;

  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(5)
  declare instructorRating?: number;

  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(5)
  declare valueRating?: number;

  @IsString()
  @IsOptional()
  declare enrollmentId?: string; // Link to enrollment
}
