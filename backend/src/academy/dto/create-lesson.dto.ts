import { IsString, IsNumber, IsArray, IsOptional, MinLength, IsEnum, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LessonType } from '@ile-ase/common';

/**
 * Create Lesson DTO
 * Lesson creation within a course
 */
export class CreateLessonDto {
  @ApiPropertyOptional({ example: 'course-uuid-123' })
  @IsString()
  @IsOptional()
  declare courseId?: string; // Can be passed in body or URL param

  @ApiProperty({ example: 'History of the 16 Odu' })
  @IsString()
  @MinLength(1)
  declare title: string;

  @ApiPropertyOptional({ example: 1 })
  @IsNumber()
  @IsOptional()
  declare order?: number; // Display order within course

  @ApiPropertyOptional({ enum: LessonType, default: LessonType.TEXT })
  @IsEnum(LessonType)
  @IsOptional()
  declare type?: LessonType;

  @ApiPropertyOptional({ example: 'Deep dive into the 16 primary Odu Ifá...' })
  @IsString()
  @IsOptional()
  declare content?: string; // Text content or transcript

  @ApiPropertyOptional({ example: 'https://example.com/video.mp4' })
  @IsUrl()
  @IsOptional()
  declare videoUrl?: string; // Video URL (S3 signed URL)

  @ApiPropertyOptional({ example: 'https://example.com/audio.mp3' })
  @IsUrl()
  @IsOptional()
  declare audioUrl?: string; // Audio URL (S3 signed URL)

  @ApiPropertyOptional({ example: 45 })
  @IsNumber()
  @IsOptional()
  declare duration?: number; // Minutes

  @ApiPropertyOptional({ example: ['https://example.com/notes.pdf'] })
  @IsArray()
  @IsUrl({}, { each: true })
  @IsOptional()
  declare resources?: string[]; // Additional resource URLs
}
