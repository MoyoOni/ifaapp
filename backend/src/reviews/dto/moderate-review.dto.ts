import { IsString, IsEnum, IsOptional, MaxLength } from 'class-validator';

export enum ReviewStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  HIDDEN = 'HIDDEN',
  REMOVED = 'REMOVED',
  FLAGGED = 'FLAGGED',
}

export class ModerateReviewDto {
  @IsEnum(ReviewStatus)
  declare status: ReviewStatus;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  declare moderationNotes?: string;
}
