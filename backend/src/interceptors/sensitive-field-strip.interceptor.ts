import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { map } from 'rxjs/operators';

/**
 * Fields that must never leave the server in an HTTP response, regardless of
 * which endpoint or how deeply nested in the response body they appear.
 *
 * P0-04: there is no DTO/ClassSerializerInterceptor layer in this codebase —
 * controllers return raw Prisma objects, and sensitive-field stripping is
 * done ad hoc per call site (e.g. `users.service.ts` manually destructures
 * `passwordHash`/`emailVerificationToken` off before returning). That works
 * only as long as every future endpoint remembers to do the same thing by
 * hand. This interceptor is the safety net: it applies globally to every
 * response, so a new endpoint that forgets the manual destructure is still
 * protected instead of silently leaking a password hash.
 */
const SENSITIVE_FIELDS = ['passwordHash', 'emailVerificationToken'];

function stripSensitiveFields(value: unknown, seen: WeakSet<object>): unknown {
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (value instanceof Date || Buffer.isBuffer(value)) {
    return value;
  }
  if (seen.has(value as object)) {
    return value; // circular reference — leave as-is rather than recurse forever
  }
  seen.add(value as object);

  if (Array.isArray(value)) {
    return value.map((item) => stripSensitiveFields(item, seen));
  }

  const result: Record<string, unknown> = { ...(value as Record<string, unknown>) };
  for (const field of SENSITIVE_FIELDS) {
    delete result[field];
  }
  for (const key of Object.keys(result)) {
    result[key] = stripSensitiveFields(result[key], seen);
  }
  return result;
}

@Injectable()
export class SensitiveFieldStripInterceptor implements NestInterceptor {
  // The `as any` cast on next.handle() (and the outer cast back) match the
  // existing pattern in interceptors/logging.interceptor.ts: this monorepo
  // has two resolved copies of rxjs (root + backend node_modules), so
  // `.pipe()`'s operator-function type and NestInterceptor's expected
  // Observable type get resolved against different physical rxjs packages
  // and TypeScript flags a spurious structural mismatch. Casting through
  // `any` is the established way this codebase already routes around it.
  intercept(_context: ExecutionContext, next: CallHandler) {
    return (next.handle() as any).pipe(
      map((data: unknown) => stripSensitiveFields(data, new WeakSet())),
    ) as any;
  }
}
