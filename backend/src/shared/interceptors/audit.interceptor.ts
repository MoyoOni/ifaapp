import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { AuditService } from '../services/audit.service';
import { User } from '../types/prisma-models';

export interface AuditMetadata {
  resourceType: string;
  action: string;
  requireAudit?: boolean;
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly auditService: AuditService,
    private readonly reflector: Reflector
  ) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    const req = context.switchToHttp().getRequest<Request>();
    // Check if audit is required for this endpoint
    const auditMetadata = this.reflector.getAllAndOverride<AuditMetadata>('audit', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!auditMetadata?.requireAudit) {
      return next.handle();
    }

    // Capture original params before handler executes
    const originalParams = { ...req.params };

    // Execute the handler and capture the response
    return (next.handle() as any).pipe(
      tap(async (response: any) => {
        try {
          // Determine the user performing the action
          const user = req.user as User;
          if (!user) {
            return; // Skip audit if no authenticated user
          }

          // Determine action type based on HTTP method
          const method = req.method.toUpperCase();
          const action = this.getActionFromMethod(method, auditMetadata.action);

          // Get resource ID from params if available
          let resourceId: string | undefined;
          if (originalParams['id']) {
            resourceId = originalParams['id'];
          } else if (originalParams['userId']) {
            resourceId = originalParams['userId'];
          }

          // Prepare audit log entry
          const auditEntry = {
            userId: user.id,
            action,
            resourceType: auditMetadata.resourceType,
            resourceId: resourceId || '',
            previousValues: this.extractPreviousValues(req, method),
            newValues: this.extractNewValues(req, method, response),
            ipAddress: this.getClientIp(req),
            userAgent: req.headers['user-agent'],
          };

          // Log the audit entry
          await this.auditService.logAction(auditEntry);
        } catch (error) {
          // Fail silently to prevent audit issues from breaking functionality
          console.error('Audit logging failed:', error);
        }
      })
    );
  }

  private getActionFromMethod(method: string, customAction?: string): string {
    if (customAction) {
      return customAction;
    }

    switch (method) {
      case 'POST':
        return 'CREATE';
      case 'PUT':
      case 'PATCH':
        return 'UPDATE';
      case 'DELETE':
        return 'DELETE';
      case 'GET':
      default:
        return 'READ';
    }
  }

  private extractPreviousValues(req: Request, method: string): Record<string, any> | undefined {
    // Previous values only make sense for UPDATE/DELETE operations
    if (method === 'PUT' || method === 'PATCH' || method === 'DELETE') {
      // In a real implementation, we would fetch the existing record from the database
      // For now, returning a placeholder - in a real app you'd fetch the entity by ID
      return undefined; // Would come from DB lookup in real implementation
    }
    return undefined;
  }

  private extractNewValues(
    req: Request,
    method: string,
    response?: any
  ): Record<string, any> | undefined {
    if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
      // For creation/update operations, use the request body
      if (Object.keys(req.body).length > 0) {
        return req.body;
      }

      // If no body, maybe it's in response (for POST that returns created entity)
      if (response && typeof response === 'object') {
        return response;
      }
    }
    return undefined;
  }

  private getClientIp(req: Request): string {
    return (
      (req.headers['x-forwarded-for'] as string) ||
      (req.headers['x-real-ip'] as string) ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      (req as any).ip
    );
  }
}
