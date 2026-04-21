import { IsEnum, IsString, MinLength } from 'class-validator';

export class CreateElderFlagDto {
  @IsString()
  @MinLength(5)
  declare reason: string;
}

export class ReactToPostDto {
  @IsString()
  declare emoji: string;
}

export enum ElderFlagAction {
  ACKNOWLEDGE = 'acknowledge',
  REMOVE_POST = 'remove_post',
  REQUEST_EDIT = 'request_edit',
  DISMISS = 'dismiss',
}

export class ReviewElderFlagDto {
  @IsEnum(ElderFlagAction)
  declare action: ElderFlagAction;
}
