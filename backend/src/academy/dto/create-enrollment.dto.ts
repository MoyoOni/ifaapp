import { IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Create Enrollment DTO
 * Student enrollment in a course
 */
export class CreateEnrollmentDto {
  @ApiProperty({ example: 'course-uuid-123' })
  @IsUUID()
  declare courseId: string;
}
