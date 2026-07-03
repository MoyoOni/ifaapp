import { SetMetadata } from '@nestjs/common';

/**
 * Mark a route as publicly accessible — bypasses JWT authentication.
 * The JwtAuthGuard (shared/guards/auth.guard.ts) reads this metadata.
 */
export const Public = () => SetMetadata('public', true);
