import { IsString, IsOptional, IsEnum } from 'class-validator';

export enum ComplaintResolutionAction {
  WARN = 'WARN',
  SUSPEND_BOOKINGS = 'SUSPEND_BOOKINGS',
  REVOKE_VERIFICATION = 'REVOKE_VERIFICATION',
  ESCALATE = 'ESCALATE',
}

export class ResolveComplaintDto {
  @IsEnum(ComplaintResolutionAction)
  action!: ComplaintResolutionAction;

  @IsOptional()
  @IsString()
  resolutionNotes?: string;

  @IsOptional()
  @IsString()
  clientNotification?: string;
}
