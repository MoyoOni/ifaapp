import { IsString, IsNumber, Min, Max, IsOptional } from 'class-validator';

export class CreateProductReviewDto {
  @IsString()
  declare productId: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  declare rating: number;

  @IsString()
  @IsOptional()
  declare title?: string;

  @IsString()
  @IsOptional()
  declare comment?: string;
}
