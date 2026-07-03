import { IsNumber, IsEnum, IsOptional, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { EnrollmentStatus } from '@ile-ase/common';

/**
 * Update Enrollment DTO
 * Update enrollment progress or status
 */
export class UpdateEnrollmentDto {
  @ApiPropertyOptional({ enum: EnrollmentStatus })
  @IsEnum(EnrollmentStatus)
  @IsOptional()
  status?: EnrollmentStatus;

  @ApiPropertyOptional({ example: 75 })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  progress?: number; // 0-100 percentage
}
