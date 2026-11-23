import { describe, it, expect } from 'vitest';
import { resolveApiBase, apiUrl } from './api-base';

describe('resolveApiBase', () => {
  it('keeps the website on relative /api even when the build sets an absolute URL', () => {
    // The production image build sets VITE_API_URL=https://iluase.com/api.
    expect(resolveApiBase(false, 'https://iluase.com/api')).toBe('/api');
  });

  it('uses the absolute URL inside the native app', () => {
    expect(resolveApiBase(true, 'https://iluase.com/api/')).toBe('https://iluase.com/api');
  });

  it('falls back to /api in the native app when no URL was configured', () => {
    expect(resolveApiBase(true, undefined)).toBe('/api');
    expect(resolveApiBase(true, '')).toBe('/api');
  });
});

describe('apiUrl', () => {
  it('joins paths with or without a leading slash (web build: relative)', () => {
    expect(apiUrl('/auth/refresh')).toBe('/api/auth/refresh');
    expect(apiUrl('auth/refresh')).toBe('/api/auth/refresh');
  });
});
