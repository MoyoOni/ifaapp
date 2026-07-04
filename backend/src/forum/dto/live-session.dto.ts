import {
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

export enum LiveSessionPlatform {
  ZOOM = 'ZOOM',
  YOUTUBE = 'YOUTUBE',
  MEET = 'MEET',
  OTHER = 'OTHER',
}

export enum LiveSessionStatus {
  SCHEDULED = 'SCHEDULED',
  LIVE = 'LIVE',
  ENDED = 'ENDED',
  CANCELLED = 'CANCELLED',
}

export class CreateLiveSessionDto {
  @IsString()
  @MinLength(3)
  declare title: string;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  declare hostIds?: string[];

  @IsDateString()
  declare scheduledAt: string;

  @IsString()
  declare platform: string;

  @IsString()
  declare externalUrl: string;

  @IsUUID()
  @IsOptional()
  declare preThreadId?: string;
}

export class UpdateLiveSessionStatusDto {
  @IsEnum(LiveSessionStatus)
  declare status: LiveSessionStatus;
}
