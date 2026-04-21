import { IsArray, IsIn, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class QueuedActionDto {
  @IsString()
  declare id: string;

  @IsString()
  declare type: string;

  @IsString()
  declare endpoint: string;

  @IsIn(['POST', 'PATCH', 'DELETE'])
  declare method: 'POST' | 'PATCH' | 'DELETE';

  declare payload: any;
}

export class SyncQueuedActionsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QueuedActionDto)
  declare actions: QueuedActionDto[];
}
