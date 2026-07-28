import { IsString } from 'class-validator';

export class RequestCommunityMentorshipDto {
  @IsString()
  declare mentorUserId: string;
}
