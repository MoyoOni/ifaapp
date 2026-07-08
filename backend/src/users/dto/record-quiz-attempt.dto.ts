import { IsBoolean } from 'class-validator';

export class RecordQuizAttemptDto {
  @IsBoolean()
  declare passed: boolean;
}
