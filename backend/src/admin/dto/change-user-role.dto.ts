import { IsEnum, IsOptional, IsString } from 'class-validator';
import { UserRole, AdminSubRole } from '@ile-ase/common';

export class ChangeUserRoleDto {
  @IsEnum(UserRole)
  declare role: UserRole;

  @IsString()
  @IsOptional()
  declare reason?: string;

  @IsEnum(AdminSubRole)
  @IsOptional()
  declare adminSubRole?: AdminSubRole;
}
