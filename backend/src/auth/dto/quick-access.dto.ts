import { IsEmail } from 'class-validator';

export class QuickAccessDto {
  @IsEmail()
  email!: string;
}
