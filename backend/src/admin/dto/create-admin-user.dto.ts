import { IsEmail, IsString, IsEnum, IsOptional } from 'class-validator';
import { UserRole } from '@common/enums/user-role.enum';
import { AdminSubRole } from '@common/enums/admin-sub-role.enum';

export class CreateAdminUserDto {
  @IsEmail()
  declare email: string;

  @IsString()
  declare name: string;

  @IsEnum(UserRole)
  declare role: UserRole;

  @IsOptional()
  @IsEnum(AdminSubRole)
  adminSubRole?: AdminSubRole;

  @IsString()
  declare password: string;
}
