import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { AdminSubRole } from '@ile-ase/common';

export class ManageAdminDto {
  @IsEmail()
  declare email: string;

  @IsString()
  declare name: string;

  @IsEnum(AdminSubRole)
  declare adminSubRole: AdminSubRole;

  @IsBoolean()
  @IsOptional()
  declare sendInvite?: boolean;
}
