import { UserRole } from '@common/enums/user-role.enum';
import { AdminSubRole } from '@common/enums/admin-sub-role.enum';

export interface CurrentUserPayload {
  id: string;
  sub: string; // userId
  email: string;
  role: UserRole;
  verified: boolean;
  isImpersonated?: boolean;
  impersonatorId?: string;
  adminSubRole?: AdminSubRole;
}