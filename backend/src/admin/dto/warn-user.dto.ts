import { IsString } from 'class-validator';

export class WarnUserDto {
  @IsString()
  message!: string;
}
