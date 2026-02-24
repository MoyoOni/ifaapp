import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from '../audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private readonly auditService: AuditService) { }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, user, ip, headers } = request;

    // Only audit mutations (POST, PATCH, DELETE) by Admins
    // We check for user existence and specific role
    if (['POST', 'PATCH', 'DELETE'].includes(method) && user?.role === 'ADMIN') {
      return next.handle().pipe(
        tap(async (data) => {
          try {
            const action = this.deriveAction(method, url);
            const entityType = this.deriveEntityType(url);
            const entityId = this.deriveEntityId(url, data);

            // Log the action asynchronously
            await this.auditService.logAction({
              adminId: user.id,
              action,
              entityType,
              entityId,
              payload: this.sanitizePayload(body),
              ipAddress: ip,
              userAgent: headers['user-agent'],
            });
          } catch (error: any) {
            this.logger.error(
              `Error in AuditInterceptor while logging ${method} ${url}: ${error.message}`
            );
          }
        })
      );
    }

    return next.handle();
  }

  private deriveAction(method: string, url: string): string {
    const parts = url
      .split('?')[0]
      .split('/')
      .filter((p) => p && p !== 'admin');

    // Check for common patterns
    if (url.includes('/approve')) return `APPROVE_${parts[0]?.toUpperCase() || 'ENTITY'}`;
    if (url.includes('/reject')) return `REJECT_${parts[0]?.toUpperCase() || 'ENTITY'}`;
    if (url.includes('/resolve')) return `RESOLVE_${parts[0]?.toUpperCase() || 'ENTITY'}`;
    if (url.includes('/process')) return `PROCESS_${parts[0]?.toUpperCase() || 'ENTITY'}`;

    const suffix = method === 'DELETE' ? 'DELETE' : method === 'PATCH' ? 'UPDATE' : 'CREATE';
    const entity = parts[0]?.toUpperCase() || 'UNKNOWN';
    return `${entity}_${suffix}`;
  }

  private deriveEntityType(url: string): string {
    const parts = url
      .split('?')[0]
      .split('/')
      .filter((p) => p && p !== 'admin');
    return parts[0]?.toUpperCase() || 'UNKNOWN';
  }

  private deriveEntityId(url: string, responseData: any): string {
    // Try to get ID from URL params (e.g., /admin/users/:id)
    const parts = url.split('?')[0].split('/');
    const lastPart = parts[parts.length - 1];

    // UUID basic check (8-4-4-4-12)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(lastPart)) {
      return lastPart;
    }

    // Fallback to response data ID or ID from body if update
    return responseData?.id || responseData?._id || 'N/A';
  }

  private sanitizePayload(payload: any): any {
    if (!payload || typeof payload !== 'object') return payload || {};

    const sanitized = { ...payload };
    const sensitiveKeys = ['password', 'token', 'cvv', 'secret', 'key'];

    Object.keys(sanitized).forEach((key) => {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some((s) => lowerKey.includes(s))) {
        sanitized[key] = '[REDACTED]';
      }
    });

    return sanitized;
  }
}
