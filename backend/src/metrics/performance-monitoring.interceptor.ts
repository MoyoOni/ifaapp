import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import { EnhancedMetricsService } from './enhanced-metrics.service';

@Injectable()
export class PerformanceMonitoringInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: EnhancedMetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request: Request = context.switchToHttp().getRequest();
    const response: Response = context.switchToHttp().getResponse();
    const userAgent = request.get('User-Agent');
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        
        // Record HTTP metrics
        this.metricsService.recordHttpRequest(
          request.method,
          request.url,
          response.statusCode,
          duration,
          request['user']?.role, // Assuming user is attached to request by auth guard
        );

        // Record performance metrics
        this.metricsService.recordCulturalContentView(
          this.determineContentType(request.url),
          this.extractLanguage(request)
        );

        // Record Yoruba language usage if applicable
        if (this.containsYorubaContent(request, response)) {
          this.metricsService.recordYorubaLanguageUsage(
            this.determineContentType(request.url),
            this.containsYorubaDiacritics(request, response)
          );
        }

        // Record user actions based on endpoint
        this.recordBusinessMetric(request, response, duration);
      }),
      catchError((error) => {
        // Record error metrics
        const duration = Date.now() - startTime;
        this.metricsService.recordHttpRequest(
          request.method,
          request.url,
          500,
          duration,
          request['user']?.role,
        );
        
        return throwError(() => error);
      })
    );
  }

  private determineContentType(url: string): string {
    if (url.includes('temple')) return 'temple';
    if (url.includes('consultation')) return 'consultation';
    if (url.includes('academy')) return 'academy';
    if (url.includes('marketplace')) return 'marketplace';
    if (url.includes('spiritual-journey')) return 'spiritual_journey';
    if (url.includes('oral-history')) return 'oral_history';
    return 'general';
  }

  private extractLanguage(request: Request): string {
    const acceptLanguage = request.get('Accept-Language');
    if (acceptLanguage?.includes('yo')) return 'yoruba';
    if (acceptLanguage?.includes('en')) return 'english';
    return 'unknown';
  }

  private containsYorubaContent(request: Request, response: Response): boolean {
    // Check request body/params
    const requestBody = JSON.stringify(request.body || {});
    const requestUrl = request.url;
    
    // Check response if available
    const responseBody = response.getHeader('_response_body_for_logging'); // Placeholder
    
    // Common Yoruba terms and phrases
    const yorubaTerms = [
      'àṣẹ', 'baba', 'ìwòsí', 'ọ̀rọ̀', 'ọ̀rọ̀ ajé', 'ọ̀rọ̀ tí àṣẹ ṣẹlẹ̀',
      'bálógó', 'balogun', 'babalawo', 'iyalo', 'iya', 'owo',
      'ọ̀pọ̀', 'ọ̀pọ̀lọ̀pọ̀', 'ọ̀kan', 'meji', 'mẹ́ta', 'mẹ́rin', 'márùn', 
      'mẹ́fa', 'mẹ́je', 'mẹ́jo', 'mẹ́san', 'mẹ́wa', 'mọ́gbọ̀n'
    ];
    
    const combinedContent = requestBody.toLowerCase() + requestUrl.toLowerCase() + (responseBody?.toString().toLowerCase() || '');
    
    return yorubaTerms.some(term => combinedContent.includes(term.toLowerCase()));
  }

  private containsYorubaDiacritics(request: Request, response: any): boolean {
    // Check for Yoruba diacritics in request/response
    const diacriticsPattern = /[\u0300-\u036F\u1AB0-\u1AFF\u1DC0-\u1DFF\u20D0-\u20FF]/;
    
    const requestBody = JSON.stringify(request.body || {});
    const requestUrl = request.url;
    const responseBody = response._body || ''; // This is a simplification
    
    const combinedContent = requestBody + requestUrl + responseBody;
    
    return diacriticsPattern.test(combinedContent);
  }

  private recordBusinessMetric(request: Request, response: Response, duration: number): void {
    const url = request.url;
    const method = request.method;

    if (method === 'POST' && url.includes('/auth/register')) {
      const role = (request.body as any)?.role || 'unknown';
      this.metricsService.recordUserRegistration(role);
    } else if (method === 'POST' && url.includes('/consultations/book')) {
      const body = request.body as any;
      this.metricsService.recordConsultationBooking(
        body.type || 'general',
        body.duration || '30min'
      );
    } else if (method === 'POST' && url.includes('/payments/process')) {
      const success = response.statusCode === 200;
      this.metricsService.recordPaymentProcessed(
        success ? 'success' : 'failure',
        'card' // Could be extracted from request body
      );
    }
  }
}