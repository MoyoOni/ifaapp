import { IsString, MinLength } from 'class-validator';

export class WarnUserDto {
  @IsString()
  @MinLength(3)
  declare message: string;
}
