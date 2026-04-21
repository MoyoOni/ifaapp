import { IsString, MinLength } from 'class-validator';

export class RejectWithReasonDto {
  @IsString()
  @MinLength(3)
  declare reason: string;
}
