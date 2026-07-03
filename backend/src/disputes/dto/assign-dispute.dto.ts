import { IsUUID } from 'class-validator';

export class AssignDisputeDto {
  @IsUUID()
  declare reviewerId: string;
}
