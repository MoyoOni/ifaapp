import { ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthController } from '../auth/auth.controller';
import { AUTH_CONTROLLER_NAME, getThrottlerConfig } from './throttler.config';

const contextFor = (cls: { name: string }) => ({ getClass: () => cls } as unknown as ExecutionContext);
const configWith = (values: Record<string, unknown> = {}) =>
  ({ get: (key: string, fallback?: unknown) => (key in values ? values[key] : fallback) } as unknown as ConfigService);

describe('getThrottlerConfig — throttler scoping', () => {
  const throttlers = () => (getThrottlerConfig(configWith()) as { throttlers: any[] }).throttlers;
  const named = (name: string) => throttlers().find((t) => t.name === name);

  it('still defines the three named throttlers with their documented defaults', () => {
    expect(named('default')).toMatchObject({ limit: 100, ttl: 60000 });
    expect(named('auth')).toMatchObject({ limit: 10, ttl: 60000 });
    expect(named('api')).toMatchObject({ limit: 500, ttl: 60000 });
  });

  it('applies the strict auth limit to AuthController routes', () => {
    expect(named('auth').skipIf(contextFor(AuthController))).toBe(false);
  });

  it('does NOT apply the strict auth limit to any other controller (it used to cap every endpoint at 10/min/IP)', () => {
    for (const name of ['UsersController', 'AnalyticsController', 'TemplesController', 'ForumController']) {
      expect(named('auth').skipIf(contextFor({ name }))).toBe(true);
    }
  });

  it('keeps the class-name match honest: AuthController must still be called what the config expects', () => {
    expect(AuthController.name).toBe(AUTH_CONTROLLER_NAME);
  });

  it('leaves the default and api throttlers applying everywhere', () => {
    expect(named('default').skipIf).toBeUndefined();
    expect(named('api').skipIf).toBeUndefined();
  });
});
