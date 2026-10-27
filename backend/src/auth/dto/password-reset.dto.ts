import { IsEmail, IsString, MinLength } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail()
  declare email: string;
}

export class ResetPasswordDto {
  @IsString()
  declare token: string;

  // Same rule as RegisterDto/SetPasswordDto
  @IsString()
  @MinLength(8)
  declare password: string;
}

export class ChangePasswordDto {
  @IsString()
  declare currentPassword: string;

  @IsString()
  @MinLength(8)
  declare newPassword: string;
}

export class ChangeEmailDto {
  @IsEmail()
  declare newEmail: string;

  @IsString()
  declare currentPassword: string;
}

export class ConfirmEmailChangeDto {
  @IsString()
  declare token: string;
}
