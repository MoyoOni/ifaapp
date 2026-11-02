import {
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export enum LiveSessionPlatform {
  ZOOM = 'ZOOM',
  YOUTUBE = 'YOUTUBE',
  MEET = 'MEET',
  OTHER = 'OTHER',
}

// FOR-019: storytelling events are live sessions of kind STORYTELLING.
export enum LiveSessionKind {
  DISCUSSION = 'DISCUSSION',
  STORYTELLING = 'STORYTELLING',
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

  @IsEnum(LiveSessionKind)
  @IsOptional()
  declare kind?: LiveSessionKind;

  @IsString()
  @MaxLength(1000)
  @IsOptional()
  declare description?: string;
}

/** FOR-019: save the story told at a storytelling event into the Oral History archive. */
export class SaveSessionStoryDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  declare title: string;

  @IsString()
  @MinLength(20)
  declare content: string;

  /** Archive category slug, e.g. "creation-stories"; defaults to "storytelling-events". */
  @IsString()
  @IsOptional()
  declare category?: string;

  /** Who told the story, as they wish to be credited. */
  @IsString()
  @MaxLength(120)
  @IsOptional()
  declare storyteller?: string;
}

export class UpdateLiveSessionStatusDto {
  @IsEnum(LiveSessionStatus)
  declare status: LiveSessionStatus;
}
