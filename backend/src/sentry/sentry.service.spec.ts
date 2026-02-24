import { Test, TestingModule } from '@nestjs/testing';
import { SentryService } from './sentry.service';
import { ConfigService } from '@nestjs/config';

jest.mock('@sentry/profiling-node', () => ({
  nodeProfilingIntegration: () => ({}),
}));
jest.mock('@sentry/node', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  setUser: jest.fn(),
  setTag: jest.fn(),
  setContext: jest.fn(),
  addBreadcrumb: jest.fn(),
}));

describe('SentryService', () => {
    let service: SentryService;

    const mockConfigService = {
        get: jest.fn((key: string) => {
            if (key === 'SENTRY_DSN') return 'https://test@sentry.io/123';
            if (key === 'NODE_ENV') return 'test';
            return null;
        }),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SentryService,
                { provide: ConfigService, useValue: mockConfigService },
            ],
        }).compile();

        service = module.get<SentryService>(SentryService);
    });

    describe('captureException', () => {
        it('should capture exception', () => {
            const error = new Error('Test error');

            expect(() => service.captureException(error)).not.toThrow();
        });

        it('should capture exception with context', () => {
            const error = new Error('Test error');
            const context = { userId: 'user-1', action: 'test' };

            expect(() => service.captureException(error, context)).not.toThrow();
        });
    });

    describe('captureMessage', () => {
        it('should capture message', () => {
            expect(() => service.captureMessage('Test message')).not.toThrow();
        });

        it('should capture message with level', () => {
            expect(() => service.captureMessage('Warning message', 'warning')).not.toThrow();
        });
    });

    describe('setUser', () => {
        it('should set user context', () => {
            const user = { id: 'user-1', email: 'user@example.com', role: 'CLIENT' };

            expect(() => service.setUser(user)).not.toThrow();
        });
    });

    describe('clearUser', () => {
        it('should clear user context', () => {
            expect(() => service.clearUser()).not.toThrow();
        });
    });

    describe('addBreadcrumb', () => {
        it('should add breadcrumb', () => {
            const breadcrumb = {
                message: 'User action',
                category: 'user',
                level: 'info' as any,
            };

            expect(() => service.addBreadcrumb(breadcrumb)).not.toThrow();
        });
    });
});
