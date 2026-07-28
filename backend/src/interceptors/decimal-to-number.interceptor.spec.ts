import { of } from 'rxjs';
import { CallHandler, ExecutionContext } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DecimalToNumberInterceptor } from './decimal-to-number.interceptor';

describe('DecimalToNumberInterceptor (ProBacklog-v1.md #15 / HUMAN_BACKLOG.md)', () => {
  let interceptor: DecimalToNumberInterceptor;
  const mockContext = {} as ExecutionContext;

  beforeEach(() => {
    interceptor = new DecimalToNumberInterceptor();
  });

  function run(data: unknown): Promise<unknown> {
    const handler: CallHandler = { handle: () => of(data) };
    return new Promise((resolve) => {
      interceptor.intercept(mockContext, handler).subscribe((result) => resolve(result));
    });
  }

  it('converts a top-level Decimal to a plain number', async () => {
    const result = await run(new Prisma.Decimal('5000.50'));
    expect(result).toBe(5000.5);
    expect(typeof result).toBe('number');
  });

  it('converts a Decimal field nested in a flat object', async () => {
    const result: any = await run({ id: 'wallet-1', balance: new Prisma.Decimal('12345.67') });

    expect(result.balance).toBe(12345.67);
    expect(typeof result.balance).toBe('number');
    expect(result.id).toBe('wallet-1');
  });

  it('converts Decimal fields in every element of an array response', async () => {
    const result: any = await run([
      { id: 'w1', balance: new Prisma.Decimal('100') },
      { id: 'w2', balance: new Prisma.Decimal('200.5') },
    ]);

    expect(result[0].balance).toBe(100);
    expect(result[1].balance).toBe(200.5);
  });

  it('converts a Decimal nested inside an included relation', async () => {
    const result: any = await run({
      id: 'user-1',
      wallet: { id: 'wallet-1', balance: new Prisma.Decimal('999.99') },
    });

    expect(result.wallet.balance).toBe(999.99);
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
    const original = { id: 'wallet-1', balance: new Prisma.Decimal('500') };
    const result: any = await run(original);

    expect(result).not.toBe(original);
    expect(original.balance).toBeInstanceOf(Prisma.Decimal); // untouched
    expect(result.balance).toBe(500);
  });

  it('handles circular references without infinite-looping', async () => {
    const node: any = { id: 'node-1', balance: new Prisma.Decimal('50') };
    node.self = node; // circular reference

    const result: any = await run(node);

    expect(result.balance).toBe(50);
    expect(result.id).toBe('node-1');
    expect(result.self).toBe(node);
  });

  it('leaves an already-clean response (no Decimals) fully intact', async () => {
    const clean = { id: 'user-1', email: 'a@example.com', role: 'CLIENT' };
    const result = await run(clean);

    expect(result).toEqual(clean);
  });
});
