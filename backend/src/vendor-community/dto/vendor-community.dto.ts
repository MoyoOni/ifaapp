import { IsDateString, IsIn, IsString, MinLength } from 'class-validator';

export class RequestMentorshipDto {
  @IsString()
  declare mentorVendorId: string;
}

export class RequestSpiritualLeaveDto {
  @IsString()
  @MinLength(1)
  declare reason: string;

  @IsDateString()
  declare startDate: string;

  @IsDateString()
  declare endDate: string;
}

export const APPRENTICESHIP_TIERS = [
  'APPRENTICE',
  'RECOGNIZED_ARTISAN',
  'MASTER_PRACTITIONER',
  'ELDER_APPROVED',
] as const;

export class UpdateVendorTierDto {
  @IsIn(APPRENTICESHIP_TIERS)
  declare tier: string;

  @IsString()
  @MinLength(1)
  declare reason: string;
}
