import { IsIn, IsString, IsNotEmpty } from 'class-validator';

// Deliberately narrower than PractitionerComplaint's resolution actions
// (WARN/SUSPEND_BOOKINGS/REVOKE_VERIFICATION/ESCALATE/DISMISS) -- REVOKE
// VERIFICATION and dispute escalation are practitioner-specific concepts
// that don't apply to a reported CLIENT/VENDOR, so this sticks to the
// generic account actions that work for any role.
export const USER_REPORT_RESOLUTION_ACTIONS = ['WARN', 'SUSPEND', 'DISMISS'] as const;

export class ResolveUserReportDto {
  @IsIn(USER_REPORT_RESOLUTION_ACTIONS)
  declare action: string;

  @IsString()
  @IsNotEmpty()
  declare resolutionNotes: string;
}
