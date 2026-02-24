import { IsString, IsNumber, IsBoolean, IsOptional, MinLength, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CourseStatus, CourseLevel } from '@ile-ase/common';

/**
 * Update Course DTO
 * Course updates (admin can approve/reject)
 */
export class UpdateCourseDto {
  @ApiPropertyOptional({ example: 'Introduction to Ifá (Updated)' })
  @IsString()
  @MinLength(1)
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ example: 'Updated course description...' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'Spiritual Practice' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ enum: CourseLevel })
  @IsEnum(CourseLevel)
  @IsOptional()
  level?: CourseLevel;

  @ApiPropertyOptional({ example: 'https://example.com/new-thumb.jpg' })
  @IsString()
  @IsOptional()
  thumbnail?: string;

  @ApiPropertyOptional({ example: 12 })
  @IsNumber()
  @IsOptional()
  duration?: number;

  @ApiPropertyOptional({ example: 59.99 })
  @IsNumber()
  @IsOptional()
  price?: number;

  @ApiPropertyOptional({ example: 'USD' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ enum: CourseStatus })
  @IsEnum(CourseStatus)
  @IsOptional()
  status?: CourseStatus; // Admin only

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  certificateEnabled?: boolean;
}
