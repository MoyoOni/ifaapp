import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ExecutionContext } from '@nestjs/common';

@Injectable()
export class ThrottlerBehindProxyFix extends ThrottlerGuard {
  protected getRequestResponse(context: ExecutionContext) {
    const http = context.switchToHttp();
    const request = http.getRequest();
    const response = http.getResponse();
    
    // Return both req and res as expected by the parent class
    return { req: request, res: response };
  }
}