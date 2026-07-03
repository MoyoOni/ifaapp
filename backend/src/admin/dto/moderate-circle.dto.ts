import { IsEnum } from 'class-validator';

export enum CircleModerateAction {
  ARCHIVE = 'ARCHIVE',
  DELETE = 'DELETE',
  ACTIVATE = 'ACTIVATE',
}

export class ModerateCircleDto {
  @IsEnum(CircleModerateAction)
  declare action: CircleModerateAction;
}
