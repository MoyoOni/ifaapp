import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { map } from 'rxjs/operators';
import { Prisma } from '@prisma/client';

/**
 * ProBacklog-v1.md item #15 / HUMAN_BACKLOG.md: Wallet.balance is now stored
 * as Prisma's Decimal type (Postgres NUMERIC) rather than Float, so Postgres
 * itself does exact decimal arithmetic on every `increment`/`decrement`
 * instead of JS floating-point. But Prisma's Decimal.toJSON() returns a
 * *string* ("5000.00"), not a number -- returned as-is, every existing
 * frontend numeric consumer (Intl.NumberFormat, toFixed, arithmetic
 * comparisons) would silently break. Rather than manually finding and
 * converting every current and future response site that might touch a
 * Decimal field, this is a global safety net, same pattern as
 * SensitiveFieldStripInterceptor: it applies to every response, so a new
 * endpoint that returns a raw Decimal is still protected instead of quietly
 * shipping a string where a number used to be.
 */
function convertDecimals(value: unknown, seen: WeakSet<object>): unknown {
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (value instanceof Prisma.Decimal) {
    return value.toNumber();
  }
  if (value instanceof Date || Buffer.isBuffer(value)) {
    return value;
  }
  if (seen.has(value as object)) {
    return value; // circular reference — leave as-is rather than recurse forever
  }
  seen.add(value as object);

  if (Array.isArray(value)) {
    return value.map((item) => convertDecimals(item, seen));
  }

  const result: Record<string, unknown> = { ...(value as Record<string, unknown>) };
  for (const key of Object.keys(result)) {
    result[key] = convertDecimals(result[key], seen);
  }
  return result;
}

@Injectable()
export class DecimalToNumberInterceptor implements NestInterceptor {
  // Same rxjs dual-package cast workaround as sensitive-field-strip.interceptor.ts.
  intercept(_context: ExecutionContext, next: CallHandler) {
    return (next.handle() as any).pipe(
      map((data: unknown) => convertDecimals(data, new WeakSet()))
    ) as any;
  }
}
