import { IsOptional, IsString, IsUUID, Matches, MaxLength } from 'class-validator';

export class CreateMentorshipBookingDto {
  @IsUUID()
  declare offeringId: string;

  // What the client hopes to work on; seen by the babalawo.
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  declare note?: string;
}

export class SetMeetingDto {
  // Where the session happens (WhatsApp, Zoom, Google Meet, phone...).
  @Matches(/^(https?:\/\/\S+|tel:\+?[0-9 ()-]{6,20}|\+?[0-9 ()-]{6,20})$/, {
    message: 'meetingLink must be a web link (https://...) or a phone number',
  })
  @MaxLength(500)
  declare meetingLink: string;

  // When, and anything the client needs to know.
  @IsOptional()
  @IsString()
  @MaxLength(500)
  declare meetingDetails?: string;
}
