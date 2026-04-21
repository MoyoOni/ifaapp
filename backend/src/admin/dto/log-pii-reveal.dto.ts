import { IsString, MinLength } from 'class-validator';

export class LogPiiRevealDto {
  @IsString()
  declare entityType: string;

  @IsString()
  declare entityId: string;

  @IsString()
  declare fieldLabel: string;

  @IsString()
  @MinLength(5)
  declare reason: string;
}
