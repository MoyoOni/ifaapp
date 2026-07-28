import { IsString, IsOptional } from 'class-validator';

// COMMUNITY_BACKLOG.md FOR-014/FOR-006: elder-initiated endorsement
export class EndorseUserDto {
  @IsString()
  @IsOptional()
  declare note?: string;
}
