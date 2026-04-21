import { IsEnum } from 'class-validator';

export enum ReportedContentAction {
  DISMISS = 'DISMISS',
  REMOVE = 'REMOVE',
}

export class ResolveReportedContentDto {
  @IsEnum(ReportedContentAction)
  declare action: ReportedContentAction;
}
