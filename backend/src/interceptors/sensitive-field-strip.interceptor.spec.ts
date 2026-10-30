import { of } from 'rxjs';
import { CallHandler, ExecutionContext } from '@nestjs/common';
import { SensitiveFieldStripInterceptor } from './sensitive-field-strip.interceptor';

describe('SensitiveFieldStripInterceptor (P0-04)', () => {
  let interceptor: SensitiveFieldStripInterceptor;
  const mockContext = {} as ExecutionContext;

  beforeEach(() => {
    interceptor = new SensitiveFieldStripInterceptor();
  });

  function run(data: unknown): Promise<unknown> {
    const handler: CallHandler = { handle: () => of(data) };
    return new Promise((resolve) => {
      interceptor.intercept(mockContext, handler).subscribe((result) => resolve(result));
    });
  }

  it('strips passwordHash and emailVerificationToken from a flat object', async () => {
    const result: any = await run({
      id: 'user-1',
      email: 'a@example.com',
      passwordHash: 'super-secret-hash',
      emailVerificationToken: 'verify-me-token',
    });

    expect(result.passwordHash).toBeUndefined();
    expect(result.emailVerificationToken).toBeUndefined();
    expect(result.id).toBe('user-1');
    expect(result.email).toBe('a@example.com');
  });

  it('strips sensitive fields from every element of an array response', async () => {
    const result: any = await run([
      { id: 'u1', passwordHash: 'h1' },
      { id: 'u2', passwordHash: 'h2' },
    ]);

    expect(result[0].passwordHash).toBeUndefined();
    expect(result[1].passwordHash).toBeUndefined();
    expect(result[0].id).toBe('u1');
    expect(result[1].id).toBe('u2');
  });

  it('strips sensitive fields nested inside included relations', async () => {
    const result: any = await run({
      id: 'appt-1',
      babalawo: {
        id: 'baba-1',
        passwordHash: 'nested-hash',
        name: 'Babalawo Adeyemi',
      },
      client: {
        id: 'client-1',
        emailVerificationToken: 'nested-token',
      },
    });

    expect(result.babalawo.passwordHash).toBeUndefined();
    expect(result.babalawo.name).toBe('Babalawo Adeyemi');
    expect(result.client.emailVerificationToken).toBeUndefined();
    expect(result.client.id).toBe('client-1');
  });

  it('leaves primitives, null, and dates untouched', async () => {
    expect(await run(null)).toBeNull();
    expect(await run('a string')).toBe('a string');
    expect(await run(42)).toBe(42);
    expect(await run(true)).toBe(true);

    const date = new Date('2026-01-01T00:00:00Z');
    const result: any = await run({ createdAt: date });
    expect(result.createdAt).toBe(date);
  });

  it('does not mutate the original response object', async () => {
    const original = { id: 'user-1', passwordHash: 'secret' };
    const result: any = await run(original);

    expect(result).not.toBe(original);
    expect(original.passwordHash).toBe('secret'); // untouched
    expect(result.passwordHash).toBeUndefined();
  });

  it('handles circular references without infinite-looping', async () => {
    const node: any = { id: 'node-1', passwordHash: 'secret' };
    node.self = node; // circular reference

    const result: any = await run(node);

    expect(result.passwordHash).toBeUndefined();
    expect(result.id).toBe('node-1');
    // The circular branch is left as-is rather than recursed into again —
    // it still points back at the original (unstripped) object, but this
    // guards against a stack overflow; real API responses are not circular.
    expect(result.self).toBe(node);
  });

  it('leaves an already-clean response fully intact', async () => {
    const clean = { id: 'user-1', email: 'a@example.com', role: 'CLIENT' };
    const result = await run(clean);

    expect(result).toEqual(clean);
  });

  describe('owner-only fields (October 30, 2026 crawl)', () => {
    const ctxFor = (user?: { id: string; role: string }) =>
      ({ switchToHttp: () => ({ getRequest: () => ({ user }) }) }) as unknown as ExecutionContext;

    function runAs(user: { id: string; role: string } | undefined, data: unknown): Promise<any> {
      const handler: CallHandler = { handle: () => of(data) };
      return new Promise((resolve) => {
        interceptor.intercept(ctxFor(user), handler).subscribe((result) => resolve(result));
      });
    }

    const product = () => ({
      id: 'p1',
      name: 'Odu reading guide',
      digitalFileUrl: 'https://drive.example/paid-file',
      digitalFileKey: 'uploads/p1.pdf',
      vendor: { id: 'v1', userId: 'vendor-user', businessName: 'Shop', taxId: 'TAX-1', businessLicense: 'LIC-1' },
    });

    it('hides a paid download link and vendor tax details from anonymous visitors', async () => {
      const result = await runAs(undefined, [product()]);
      expect(result[0].digitalFileUrl).toBeUndefined();
      expect(result[0].vendor.taxId).toBeUndefined();
      expect(result[0].vendor.businessLicense).toBeUndefined();
      expect(result[0].vendor.businessName).toBe('Shop');
      expect(result[0].name).toBe('Odu reading guide');
    });

    it('hides them from another signed-in member', async () => {
      const result = await runAs({ id: 'someone-else', role: 'CLIENT' }, product());
      expect(result.digitalFileUrl).toBeUndefined();
      expect(result.vendor.taxId).toBeUndefined();
    });

    it('keeps them for the vendor who owns the product', async () => {
      const result = await runAs({ id: 'vendor-user', role: 'VENDOR' }, product());
      expect(result.digitalFileUrl).toBe('https://drive.example/paid-file');
      expect(result.vendor.taxId).toBe('TAX-1');
    });

    it('keeps them for an admin', async () => {
      const result = await runAs({ id: 'admin-1', role: 'ADMIN' }, product());
      expect(result.digitalFileUrl).toBe('https://drive.example/paid-file');
      expect(result.vendor.businessLicense).toBe('LIC-1');
    });

    it('keeps a bank account number only for its owner', async () => {
      const account = { id: 'b1', userId: 'u1', bankName: 'GTBank', accountNumber: '0123456789' };
      expect((await runAs({ id: 'u1', role: 'CLIENT' }, account)).accountNumber).toBe('0123456789');
      expect((await runAs({ id: 'u2', role: 'CLIENT' }, account)).accountNumber).toBeUndefined();
    });

    it('never returns secrets, even to the owner or an admin', async () => {
      const result = await runAs({ id: 'vendor-user', role: 'ADMIN' }, {
        ...product(),
        userId: 'vendor-user',
        tokenHash: 'h',
        fcmTokens: ['t'],
        paystackEmailToken: 'pk',
      });
      expect(result.digitalFileKey).toBeUndefined();
      expect(result.tokenHash).toBeUndefined();
      expect(result.fcmTokens).toBeUndefined();
      expect(result.paystackEmailToken).toBeUndefined();
    });
  });
});
