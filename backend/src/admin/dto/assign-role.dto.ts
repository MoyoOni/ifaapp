import { IsString, IsNotEmpty, IsEnum, IsOptional, IsArray } from 'class-validator';
import { UserRole } from '@common/enums/user-role.enum';

export class AssignRoleDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsEnum(UserRole)
  @IsNotEmpty()
  role!: UserRole;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];
}
