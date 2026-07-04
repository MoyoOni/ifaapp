import { describe, it, expect } from 'vitest';
import { UserRole, AdminSubRole } from '@common';
import { mapAuthUserToUser, mapDemoUserToUser } from './auth.mapper';
import type { AuthUserResponse } from '@/types/api/auth';
import type { DemoUser } from '@/demo';

describe('mapAuthUserToUser (P2-01)', () => {
  it('maps the raw auth response into the User view model', () => {
    const dto: AuthUserResponse = {
      id: 'user-1',
      email: 'seeker@example.com',
      name: 'Amina',
      role: UserRole.CLIENT,
      verified: true,
      yorubaName: 'Adunni',
      culturalLevel: 'Omo Ilé',
      hasOnboarded: true,
      adminSubRole: null,
    };

    const result = mapAuthUserToUser(dto);

    expect(result).toEqual({
      id: 'user-1',
      email: 'seeker@example.com',
      name: 'Amina',
      role: UserRole.CLIENT,
      verified: true,
      hasOnboarded: true,
      yorubaName: 'Adunni',
      culturalLevel: 'Omo Ilé',
      adminSubRole: undefined,
    });
  });

  it('normalizes null optional fields to undefined', () => {
    const dto: AuthUserResponse = {
      id: 'user-2',
      email: 'admin@example.com',
      name: 'Admin',
      role: UserRole.ADMIN,
      verified: true,
      hasOnboarded: true,
      yorubaName: null,
      culturalLevel: null,
      adminSubRole: AdminSubRole.SUPER,
    };

    const result = mapAuthUserToUser(dto);

    expect(result.yorubaName).toBeUndefined();
    expect(result.culturalLevel).toBeUndefined();
    expect(result.adminSubRole).toBe(AdminSubRole.SUPER);
  });
});

describe('mapDemoUserToUser (P2-01)', () => {
  it('fills in fields DemoUser does not have (hasOnboarded) rather than requiring an unsafe cast', () => {
    const demo: DemoUser = {
      id: 'demo-client-1',
      name: 'Amina Adebayo',
      email: 'amina@example.com',
      role: UserRole.CLIENT,
    };

    const result = mapDemoUserToUser(demo);

    expect(result.hasOnboarded).toBe(true);
    expect(result.id).toBe('demo-client-1');
    expect(result.email).toBe('amina@example.com');
  });

  it('defaults a missing email rather than producing an invalid User', () => {
    const demo: DemoUser = {
      id: 'demo-baba-1',
      name: 'Baba Femi',
      role: UserRole.BABALAWO,
    };

    const result = mapDemoUserToUser(demo);

    expect(result.email).toBe('demo-baba-1@demo.iluase.local');
  });

  it('applies overrides after the base mapping (e.g. adminSubRole for the demo admin)', () => {
    const demo: DemoUser = {
      id: 'demo-admin-1',
      name: 'Admin',
      email: 'admin@example.com',
      role: UserRole.ADMIN,
    };

    const result = mapDemoUserToUser(demo, { adminSubRole: AdminSubRole.SUPER });

    expect(result.adminSubRole).toBe(AdminSubRole.SUPER);
  });
});
