import { IsUUID } from 'class-validator';

export class ManualEnrollDto {
  @IsUUID()
  declare courseId: string;

  @IsUUID()
  declare userId: string;
}
