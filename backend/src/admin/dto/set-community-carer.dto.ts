import { IsBoolean } from 'class-validator';

export class SetCommunityCarerDto {
  @IsBoolean()
  isCarer!: boolean;
}
