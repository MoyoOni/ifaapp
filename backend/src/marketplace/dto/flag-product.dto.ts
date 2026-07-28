import { IsString, MinLength } from 'class-validator';

export class FlagProductDto {
  @IsString()
  @MinLength(1)
  declare reason: string;
}
