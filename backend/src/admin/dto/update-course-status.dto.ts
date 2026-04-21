import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum CourseStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export class UpdateCourseStatusDto {
  @IsEnum(CourseStatus)
  declare status: CourseStatus;

  @IsString()
  @IsOptional()
  declare reason?: string;
}
