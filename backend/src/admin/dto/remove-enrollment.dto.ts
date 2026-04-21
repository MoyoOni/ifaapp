import { IsUUID } from 'class-validator';

export class RemoveEnrollmentDto {
  @IsUUID()
  declare userId: string;
}
