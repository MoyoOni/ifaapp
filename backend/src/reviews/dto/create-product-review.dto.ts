import { IsString, IsOptional, IsInt, IsEnum, Min, Max, MaxLength } from 'class-validator';

export class CreateProductReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  title?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  content?: string;

  @IsString()
  @IsOptional()
  orderId?: string; // Link to order if review is from purchase
}
