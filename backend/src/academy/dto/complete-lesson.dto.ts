import { IsString, IsUUID, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Complete Lesson DTO
 * Mark a lesson as completed for an enrollment
 */
export class CompleteLessonDto {
  @ApiProperty({ example: 'lesson-uuid-123' })
  @IsUUID()
  declare lessonId: string;

  @ApiPropertyOptional({ example: 'enrollment-uuid-123' })
  @IsUUID()
  @IsOptional()
  declare enrollmentId?: string; // Can be passed in URL param or body
}
