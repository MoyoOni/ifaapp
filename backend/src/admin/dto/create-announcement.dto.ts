import { IsString, IsEnum, IsOptional, IsArray, IsDateString, MinLength } from 'class-validator';

// Matches the real `Announcement` Prisma model exactly (schema.prisma) --
// the previous version of this DTO (link/isDismissible/sendEmail/subject/
// userIds) described a richer design that was never actually migrated to
// the database; see ProBacklog-v1.md P3-10 for the full reconciliation.
export enum AnnouncementSeverity {
  INFO = 'info',
  WARNING = 'warning',
  SUCCESS = 'success',
  CRITICAL = 'critical',
}

export enum AnnouncementTarget {
  ALL = 'ALL',
  CLIENT = 'CLIENT',
  BABALAWO = 'BABALAWO',
  VENDOR = 'VENDOR',
  DEVOTED = 'DEVOTED',
  SPECIFIC = 'SPECIFIC',
}

export class CreateAnnouncementDto {
  @IsString()
  @MinLength(1)
  title!: string;

  // Maps to the `content` column -- named `message` here to match the
  // field name both existing frontend components already use.
  @IsString()
  @MinLength(1)
  message!: string;

  @IsEnum(AnnouncementSeverity)
  type!: AnnouncementSeverity;

  @IsOptional()
  @IsEnum(AnnouncementTarget)
  target?: AnnouncementTarget;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetIds?: string[];

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
