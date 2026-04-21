import { IsBoolean } from 'class-validator';

export class UpdateItemCompletionDto {
  @IsBoolean()
  declare completed: boolean;
}
