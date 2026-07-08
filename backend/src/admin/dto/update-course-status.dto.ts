import { IsEnum, IsOptional, IsString } from 'class-validator';
import { CourseStatus } from '@ile-ase/common';

export class UpdateCourseStatusDto {
  @IsEnum(CourseStatus)
  declare status: CourseStatus;

  @IsString()
  @IsOptional()
  declare reason?: string;
}
