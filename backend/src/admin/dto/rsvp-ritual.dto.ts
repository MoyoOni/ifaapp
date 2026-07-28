import { IsString, IsOptional, IsBoolean } from 'class-validator';

// COMMUNITY_BACKLOG.md FOR-013: RSVP + optional intention for a SacredCalendarEvent
export class RsvpRitualDto {
  @IsString()
  @IsOptional()
  intention?: string;

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}
