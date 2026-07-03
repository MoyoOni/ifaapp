import { IsString, IsNumber, IsArray, IsOptional, MinLength, IsEnum, IsUrl } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { LessonType } from '@ile-ase/common';

/**
 * Update Lesson DTO
 */
export class UpdateLessonDto {
  @ApiPropertyOptional({ example: 'Lesson Title' })
  @IsString()
  @MinLength(1)
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ example: 2 })
  @IsNumber()
  @IsOptional()
  order?: number;

  @ApiPropertyOptional({ enum: LessonType })
  @IsEnum(LessonType)
  @IsOptional()
  type?: LessonType;

  @ApiPropertyOptional({ example: 'Updated content...' })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({ example: 'https://example.com/video.mp4' })
  @IsUrl()
  @IsOptional()
  videoUrl?: string;

  @ApiPropertyOptional({ example: 'https://example.com/audio.mp3' })
  @IsUrl()
  @IsOptional()
  audioUrl?: string;

  @ApiPropertyOptional({ example: 60 })
  @IsNumber()
  @IsOptional()
  duration?: number;

  @ApiPropertyOptional({ example: ['https://example.com/ref.pdf'] })
  @IsArray()
  @IsUrl({}, { each: true })
  @IsOptional()
  resources?: string[];

  @ApiPropertyOptional({ example: 'PUBLISHED' })
  @IsString()
  @IsOptional()
  status?: string; // DRAFT, PUBLISHED
}
