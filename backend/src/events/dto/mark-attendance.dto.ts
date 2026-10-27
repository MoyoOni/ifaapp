import { IsBoolean } from 'class-validator';

export class MarkAttendanceDto {
  @IsBoolean()
  declare attended: boolean;
}
