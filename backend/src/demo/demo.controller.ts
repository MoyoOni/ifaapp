import { Controller, Get, Post, Body, Logger } from '@nestjs/common';

@Controller('demo')
export class DemoController {
  private readonly logger = new Logger(DemoController.name);

  @Get('health')
  getHealth() {
    this.logger.log('Demo health check endpoint called');
    return {
      status: 'ok',
      message: 'Enhanced logging system is working',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('structured-log')
  structuredLog(@Body() body: any) {
    // Demonstrate structured logging
    this.logger.log('Structured log demo', {
      userId: 'demo-user-123',
      action: 'test_structured_logging',
      payload: body,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      message: 'Structured log recorded',
      receivedData: body,
    };
  }
}
