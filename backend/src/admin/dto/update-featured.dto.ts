import { IsString, IsBoolean } from 'class-validator';

export class UpdateFeaturedDto {
  @IsString()
  userId!: string;

  @IsBoolean()
  isFeatured!: boolean;
}