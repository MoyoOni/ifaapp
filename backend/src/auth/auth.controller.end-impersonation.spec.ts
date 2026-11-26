import { AuthController } from './auth.controller';
import { ImpersonationService } from '../shared/services/impersonation.service';

describe('POST /auth/end-impersonation', () => {
  const authService = { logout: jest.fn().mockResolvedValue({ message: 'Logged out successfully' }) };
  const controller = new AuthController(authService as any);
  beforeEach(() => authService.logout.mockClear());

  it('revokes the impersonation token (it used to stay valid for its full 30 minutes)', async () => {
    const res = await controller.endImpersonation({ id: 'u1', isImpersonated: true, impersonatedBy: 'admin-9', jti: 'imp-jti', exp: 123 });
    expect(authService.logout).toHaveBeenCalledWith('imp-jti', 123);
    expect(res).toEqual({ message: 'Impersonation ended successfully' });
  });

  it('does nothing for a normal session', async () => {
    await expect(controller.endImpersonation({ id: 'u1', isImpersonated: false, jti: 'normal' })).resolves.toEqual({
      message: 'Not currently impersonating any user',
    });
    expect(authService.logout).not.toHaveBeenCalled();
  });

  it('propagates a failure to record the revocation (no false success)', async () => {
    authService.logout.mockRejectedValueOnce(new Error('session store unavailable'));
    await expect(controller.endImpersonation({ id: 'u1', isImpersonated: true, jti: 'imp-jti' })).rejects.toThrow('session store unavailable');
  });
});

describe('impersonation tokens', () => {
  it('carry a unique jti so logout and end-impersonation can revoke them', async () => {
    const sign = jest.fn().mockReturnValue('signed');
    const svc = new ImpersonationService(
      { sign } as any,
      { findById: jest.fn().mockResolvedValue({ id: 'u2', email: 'u2@x.test', role: 'CLIENT' }) } as any,
      { logAction: jest.fn().mockResolvedValue(undefined) } as any
    );
    jest.spyOn(svc as any, 'canImpersonate').mockReturnValue(true);

    await svc.initiateImpersonation({ id: 'admin-9', email: 'a@x.test', role: 'ADMIN' } as any, 'u2', 'support ticket 123');
    await svc.initiateImpersonation({ id: 'admin-9', email: 'a@x.test', role: 'ADMIN' } as any, 'u2', 'support ticket 123');

    const [first, second] = sign.mock.calls.map((c) => c[0]);
    expect(first).toEqual(expect.objectContaining({ isImpersonated: true, impersonatedBy: 'admin-9', jti: expect.any(String) }));
    expect(second.jti).not.toBe(first.jti);
  });
});
