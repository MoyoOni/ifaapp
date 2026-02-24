/**
 * Tutor Enumerations
 * Status and type enums for the Tutor module
 */

export enum TutorStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  SUSPENDED = 'SUSPENDED',
  REJECTED = 'REJECTED'
}

export enum TutorSessionStatus {
  UPCOMING = 'UPCOMING',
  IN_SESSION = 'IN_SESSION',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export type TutorStatusType = keyof typeof TutorStatus;
export type TutorSessionStatusType = keyof typeof TutorSessionStatus;
