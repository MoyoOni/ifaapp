import { BadRequestException } from '@nestjs/common';
import { AuthController } from './auth.controller';

describe('AuthController verify-email', () => {
  const authService = { verifyEmail: jest.fn().mockResolvedValue({ message: 'ok' }) };
  const controller = new AuthController(authService as any);
  beforeEach(() => authService.verifyEmail.mockClear());

  it('POST takes the token from the body', async () => {
    await expect(controller.verifyEmailPost('tok-1')).resolves.toEqual({ message: 'ok' });
    expect(authService.verifyEmail).toHaveBeenCalledWith('tok-1');
  });
  it.each([undefined, '', 42, { $ne: null }, ['a']])('POST rejects a missing or non-string token (%p)', async (bad) => {
    await expect(controller.verifyEmailPost(bad)).rejects.toBeInstanceOf(BadRequestException);
    expect(authService.verifyEmail).not.toHaveBeenCalled();
  });
  it('the deprecated GET still works during the rollout', async () => {
    await expect(controller.verifyEmail('tok-2')).resolves.toEqual({ message: 'ok' });
    expect(authService.verifyEmail).toHaveBeenCalledWith('tok-2');
  });
});
