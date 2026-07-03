import { AnnouncementType, AnnouncementTarget } from './create-announcement.dto';

export class AnnouncementResponseDto {
  id!: string;
  title!: string;
  content!: string;
  type!: AnnouncementType;
  target!: AnnouncementTarget;
  userIds?: string[];
  link?: string;
  isDismissible!: boolean;
  scheduledAt?: Date;
  expiresAt?: Date;
  sendEmail!: boolean;
  subject?: string;
  sentAt?: Date;
  createdAt!: Date;
  updatedAt!: Date;
}
