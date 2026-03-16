import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { captureException, withScope } from '../sentry';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SentryInterceptor implements NestInterceptor {
  private readonly logger = new Logger(SentryInterceptor.name);

  constructor(private configService: ConfigService) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    if (process.env.NODE_ENV === 'development') {
      // Skip Sentry in development
      return next.handle();
    }

    return (next.handle() as any).pipe(
      catchError((error: any) => {
        const request = context.switchToHttp().getRequest();
        const ctx: Record<string, unknown> = {};
        if (request) {
          ctx['url'] = request.url;
          ctx['method'] = request.method;
          if (request.user) ctx['userId'] = request.user.id;
        }
        withScope((scope: any) => {
          if (scope?.setExtra) {
            Object.entries(ctx).forEach(([k, v]) => scope.setExtra(k, v));
          }
          captureException(error);
          this.logger.error('Captured error in Sentry', error);
        });

        return throwError(() => error);
      })
    );
  }
}
