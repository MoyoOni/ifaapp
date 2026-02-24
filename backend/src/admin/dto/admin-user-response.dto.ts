import { UserRole } from '@common/enums/user-role.enum';
import { AdminSubRole } from '@common/enums/admin-sub-role.enum';

export class AdminUserResponseDto {
  declare id: string;
  declare email: string;
  declare name: string;
  declare role: UserRole;
  adminSubRole?: AdminSubRole;
  declare verified: boolean;
  declare createdAt: Date;
  updatedAt?: Date;
}
