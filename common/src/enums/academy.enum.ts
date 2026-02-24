/**
 * Academy Enumerations
 * Status and type enums for the Academy module
 */

export enum CourseStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ARCHIVED = 'ARCHIVED'
}

export enum LessonType {
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  TEXT = 'TEXT',
  QUIZ = 'QUIZ'
}

export enum EnrollmentStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum CourseLevel {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED'
}

export type CourseStatusType = keyof typeof CourseStatus;
export type LessonTypeType = keyof typeof LessonType;
export type EnrollmentStatusType = keyof typeof EnrollmentStatus;
export type CourseLevelType = keyof typeof CourseLevel;
