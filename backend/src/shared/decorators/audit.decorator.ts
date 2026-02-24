import { SetMetadata } from '@nestjs/common';
import { AuditMetadata } from '../interceptors/audit.interceptor';

export const Audit = (options: Omit<AuditMetadata, 'requireAudit'>) =>
  SetMetadata('audit', { ...options, requireAudit: true });