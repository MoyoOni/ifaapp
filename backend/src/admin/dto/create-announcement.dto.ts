import { IsString, IsEnum, IsOptional, IsBoolean, IsDate, IsEmail, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export enum AnnouncementType {
  BANNER = 'BANNER',
  IN_APP_NOTIFICATION = 'IN_APP_NOTIFICATION',
  EMAIL_BROADCAST = 'EMAIL_BROADCAST',
}

export enum AnnouncementTarget {
  ALL_USERS = 'ALL_USERS',
  CLIENTS = 'CLIENTS',
  BABALAWOS = 'BABALAWOS',
  VENDORS = 'VENDORS',
  DEVOTED_SUBSCRIBERS = 'DEVOTED_SUBSCRIBERS',
  SPECIFIC_USERS = 'SPECIFIC_USERS',
}

export class CreateAnnouncementDto {
  @IsString()
  title!: string;

  @IsString()
  content!: string;

  @IsEnum(AnnouncementType)
  type!: AnnouncementType;

  @IsEnum(AnnouncementTarget)
  target!: AnnouncementTarget;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  userIds?: string[];

  @IsOptional()
  @IsString()
  link?: string;

  @IsOptional()
  @IsBoolean()
  isDismissible?: boolean;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  scheduledAt?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  expiresAt?: Date;

  @IsOptional()
  @IsBoolean()
  sendEmail?: boolean;

  @IsOptional()
  @IsString()
  subject?: string;
}