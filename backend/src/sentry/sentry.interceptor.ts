import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import * as Sentry from '@sentry/node';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SentryInterceptor implements NestInterceptor {
  constructor(private configService: ConfigService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (process.env.NODE_ENV === 'development') {
      // Skip Sentry in development
      return next.handle();
    }

    return next.handle().pipe(
      catchError((error) => {
        // Capture the error in Sentry
        Sentry.withScope((scope) => {
          // Add context based on the request
          const request = context.switchToHttp().getRequest();
          
          if (request) {
            scope.setExtra('url', request.url);
            scope.setExtra('method', request.method);
            scope.setExtra('params', request.params);
            scope.setExtra('query', request.query);
            scope.setExtra('body', request.body);
            
            // Add user context if available
            if (request.user) {
              scope.setUser({
                id: request.user.id,
                email: request.user.email,
                username: request.user.username,
              });
            }
          }

          // Capture the exception
          const eventId = Sentry.captureException(error);
          console.error(`Sentry Event ID: ${eventId}`, error);
        });

        return throwError(() => error);
      })
    );
  }
}