import { IsString } from 'class-validator';

export class LogPiiRevealDto {
  @IsString()
  declare targetUserId: string;

  @IsString()
  declare reason: string;
}