import { z } from 'zod';

/**
 * Environment variable validation at application startup.
 * Application fails fast with clear error messages if required config is missing or invalid.
 * See .env.example and README for all variables.
 */
const envSchema = z.object({
  // Required
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL is required (e.g. postgresql://user:pass@localhost:5432/dbname)'),
  JWT_SECRET: z
    .string()
    .min(
      32,
      'JWT_SECRET must be at least 32 characters (use a secure random string in production)'
    ),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, 'JWT_REFRESH_SECRET must be at least 32 characters when set')
    .optional(),

  // Server
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  FRONTEND_URL: z.string().url().optional().default('http://localhost:5173'),

  // JWT optional tuning
  JWT_EXPIRES_IN: z.string().optional().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().optional().default('7d'),

  // Messaging (required for messaging module encryption)
  ENCRYPTION_KEY: z.string().length(32).optional(), // Validation handled by EncryptionKeyService

  // Feature flags (dev only; auth.controller checks at runtime)
  ENABLE_QUICK_ACCESS: z.string().optional(),

  // Optional services (no validation, just pass through)
  AWS_REGION: z.string().optional(),
  AWS_S3_BUCKET_NAME: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  SENDGRID_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  PAYSTACK_SECRET_KEY: z.string().optional(),
  FLUTTERWAVE_PUBLIC_KEY: z.string().optional(),
  FLUTTERWAVE_SECRET_KEY: z.string().optional(),
  FLUTTERWAVE_SECRET_HASH: z.string().optional(),
  AGORA_APP_ID: z.string().optional(),
  AGORA_APP_CERTIFICATE: z.string().optional(),
  ENABLE_VIRUS_SCAN: z.string().optional(),
  FCM_SERVER_KEY: z.string().optional(),
  APNS_KEY_ID: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
}); // extra keys from .env are allowed (optional services)

export type Env = z.infer<typeof envSchema>;

// Custom validation to check if ENCRYPTION_KEY is required based on NODE_ENV
export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(
      `Environment validation failed:\n${issues}\n\nCheck .env and .env.example. Required variables: DATABASE_URL, JWT_SECRET (min 32 chars).`
    );
  }

  // Additional validation: ENCRYPTION_KEY is required in production
  if (parsed.data.NODE_ENV === 'production' && !parsed.data.ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY is required in production for secure messaging');
  }

  return parsed.data;
}
