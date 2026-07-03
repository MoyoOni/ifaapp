import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class SetThreadSacredDto {
  @IsBoolean()
  declare isSacred: boolean;

  @IsString()
  @IsOptional()
  declare reason?: string;
}
