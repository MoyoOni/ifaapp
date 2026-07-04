import { describe, it, expect } from 'vitest';
import { decodeJwtPayload } from './jwt';

function makeToken(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.fakesignature`;
}

describe('decodeJwtPayload (P2-01)', () => {
  it('decodes a well-formed JWT payload', () => {
    const token = makeToken({ sub: 'user-1', isImpersonated: true, impersonatedBy: 'admin-1' });
    const result = decodeJwtPayload<{ sub: string; isImpersonated: boolean; impersonatedBy: string }>(token);

    expect(result).toEqual({ sub: 'user-1', isImpersonated: true, impersonatedBy: 'admin-1' });
  });

  it('returns null for a malformed token', () => {
    expect(decodeJwtPayload('not-a-jwt')).toBeNull();
  });

  it('returns null for an empty string', () => {
    expect(decodeJwtPayload('')).toBeNull();
  });
});
