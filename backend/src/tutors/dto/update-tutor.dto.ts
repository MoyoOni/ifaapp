import { IsString, IsOptional, IsEnum } from 'class-validator';

export enum TutorStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  SUSPENDED = 'SUSPENDED',
  REJECTED = 'REJECTED',
}

/**
 * Update Tutor DTO
 * Admin-only: Update tutor status
 */
export class UpdateTutorDto {
  @IsEnum(TutorStatus)
  @IsOptional()
  declare status?: TutorStatus;

  @IsString()
  @IsOptional()
  declare description?: string;
}
