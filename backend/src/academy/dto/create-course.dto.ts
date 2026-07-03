import { IsString, IsNumber, IsBoolean, IsOptional, MinLength, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CourseLevel } from '@ile-ase/common';

/**
 * Create Course DTO
 * Course creation (requires Community Advisory Council approval)
 */
export class CreateCourseDto {
  @ApiProperty({ example: 'Introduction to Ifá' })
  @IsString()
  @MinLength(1)
  declare title: string;

  @ApiProperty({ example: 'intro-to-ifa' })
  @IsString()
  @MinLength(1)
  declare slug: string;

  @ApiProperty({ example: 'A comprehensive guide to the basics of Ifá practice.' })
  @IsString()
  @MinLength(1)
  declare description: string;

  @ApiProperty({ example: 'Foundational' })
  @IsString()
  @MinLength(1)
  declare category: string; // foundational, spiritual_practice, advanced_priestly, cultural_studies

  @ApiPropertyOptional({ enum: CourseLevel, default: CourseLevel.BEGINNER })
  @IsEnum(CourseLevel)
  @IsOptional()
  declare level?: CourseLevel;

  @ApiPropertyOptional({ example: 'https://example.com/thumbnail.jpg' })
  @IsString()
  @IsOptional()
  declare thumbnail?: string; // URL to thumbnail image

  @ApiPropertyOptional({ example: 10 })
  @IsNumber()
  @IsOptional()
  declare duration?: number; // Estimated hours

  @ApiPropertyOptional({ example: 0 })
  @IsNumber()
  @IsOptional()
  declare price?: number; // Default: 0 (free)

  @ApiPropertyOptional({ example: 'NGN' })
  @IsString()
  @IsOptional()
  declare currency?: string; // Default: NGN

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  declare certificateEnabled?: boolean; // Default: true
}
