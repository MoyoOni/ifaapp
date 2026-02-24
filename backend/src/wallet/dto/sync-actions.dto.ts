import { IsArray, IsString, IsEnum, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum QueuedActionType {
  MESSAGE = 'message',
  APPOINTMENT = 'appointment',
  DOCUMENT = 'document',
  POST = 'post',
  ACKNOWLEDGMENT = 'acknowledgment',
}

export class QueuedActionDto {
  @IsString()
  declare id: string;

  @IsEnum(QueuedActionType)
  declare type: QueuedActionType;

  @IsString()
  declare endpoint: string;

  @IsString()
  declare method: 'POST' | 'PATCH' | 'DELETE';

  payload: any;
}

export class SyncActionsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QueuedActionDto)
  declare actions: QueuedActionDto[];
}
