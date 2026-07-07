import { IsString, IsIn, IsOptional } from 'class-validator';

export class FeaturedSearchDto {
  @IsString()
  @IsIn(['thread', 'product', 'course', 'circle'])
  declare type: string;

  @IsString()
  declare q: string;
}