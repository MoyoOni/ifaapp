import { IsEmail, IsString } from 'class-validator';

export class QuickAccessDto {
  @IsEmail()
  email!: string;

  @IsString()
  name!: string;
}