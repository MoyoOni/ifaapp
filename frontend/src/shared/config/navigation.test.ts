import { describe, it, expect } from 'vitest';
import { getNavItemsForRole } from './navigation';

describe('getNavItemsForRole', () => {
  it('gives logged-out visitors only public destinations, never account-only ones', () => {
    const items = getNavItemsForRole(undefined);
    const ids = items.map((i) => i.id);
    const paths = items.map((i) => i.path);

    expect(ids).toEqual(expect.arrayContaining(['temples', 'learning-path', 'community-circles', 'forum']));
    expect(ids).not.toContain('wallet');
    expect(ids).not.toContain('profile');
    expect(ids).not.toContain('directory');
    // login-gated routes: a visitor clicking these just bounced to /login
    expect(paths.filter((p) => p.startsWith('/client/'))).toEqual([]);
    expect(paths).toContain('/temples');
  });

  it('still gives a logged-in client the full menu including wallet and profile', () => {
    const ids = getNavItemsForRole('CLIENT').map((i) => i.id);
    expect(ids).toEqual(expect.arrayContaining(['wallet', 'profile', 'directory']));
  });
});
