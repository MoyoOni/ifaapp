import { IsString, IsOptional, IsInt, Min, Max, MaxLength } from 'class-validator';

export class CreateBabalawoReviewDto {
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
  declare accuracyRating?: number;

  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(5)
  declare communicationRating?: number;

  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(5)
  declare culturalRespectRating?: number;

  @IsString()
  @IsOptional()
  declare appointmentId?: string; // Link to appointment if review is from session
}
