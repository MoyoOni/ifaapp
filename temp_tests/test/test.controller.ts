import { Controller, Get, Post, HttpException, HttpStatus } from '@nestjs/common';
import { captureException } from '../sentry';

/**
 * Test controller for verifying Sentry error tracking.
 * These endpoints should only be used in development/staging.
 */
@Controller('test')
export class TestController {
    @Get('sentry/error')
    testSentryError() {
        throw new Error('[TEST] Sentry test error - this should appear in Sentry dashboard');
    }

    @Get('sentry/http-exception')
    testSentryHttpException() {
        throw new HttpException(
            '[TEST] Sentry HTTP exception test',
            HttpStatus.INTERNAL_SERVER_ERROR,
        );
    }

    @Post('sentry/manual-capture')
    testManualCapture() {
        try {
            throw new Error('[TEST] Manually captured error');
        } catch (error) {
            captureException(error, {
                testContext: 'manual-capture-endpoint',
                timestamp: new Date().toISOString(),
            });
            return {
                success: true,
                message: 'Error manually captured and sent to Sentry',
            };
        }
    }

    @Get('sentry/validation-error')
    testValidationError() {
        // This should be ignored by Sentry (configured in sentry.ts)
        throw new HttpException(
            { message: 'Validation failed', errors: ['field1 is required'] },
            HttpStatus.BAD_REQUEST,
        );
    }

    @Get('health')
    healthCheck() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            sentry: {
                configured: !!process.env.SENTRY_DSN,
                dsn: process.env.SENTRY_DSN ? '***configured***' : 'not configured',
            },
        };
    }
}
