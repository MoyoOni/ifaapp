import { IsIn, IsString, IsNotEmpty } from 'class-validator';

// COMMUNITY_BACKLOG.md FOR-016: previously `action` accepted any non-empty
// string but resolveComplaint() only ever checked `=== 'resolve'` (a value
// the frontend never actually sent -- it sends one of these four). That bug
// meant every resolution silently became DISMISSED regardless of which
// action the admin picked, and none of them ever took effect on the
// practitioner's account. Fixed alongside restricting to a real enum.
export const COMPLAINT_RESOLUTION_ACTIONS = [
  'WARN',
  'SUSPEND_BOOKINGS',
  'REVOKE_VERIFICATION',
  'ESCALATE',
  'DISMISS',
] as const;

export class ResolveComplaintDto {
  @IsIn(COMPLAINT_RESOLUTION_ACTIONS)
  declare action: string;

  @IsString()
  @IsNotEmpty()
  declare resolutionNotes: string;

  @IsString()
  @IsNotEmpty()
  declare clientNotification: string;
}
