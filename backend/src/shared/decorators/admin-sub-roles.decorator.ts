import { SetMetadata } from '@nestjs/common';
import { AdminSubRole } from '@common/enums/admin-sub-role.enum';

export const AdminSubRoles = (...subRoles: AdminSubRole[]) => 
  SetMetadata('admin-sub-roles', subRoles);