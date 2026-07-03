import { IsEnum } from 'class-validator';

export enum ReportAction {
  DISMISS = 'dismiss',
  HIDE_POST = 'hide_post',
  WARN_USER = 'warn_user',
  BAN_USER = 'ban_user',
}

export class ReviewReportDto {
  @IsEnum(ReportAction)
  declare action: ReportAction;
}
