import { z } from 'zod';

const originsSchema = z
  .string()
  .transform((value) =>
    value
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  )
  .pipe(z.array(z.string().url()).min(1));

const booleanEnvSchema = z
  .union([z.boolean(), z.enum(['true', 'false'])])
  .transform((value) => value === true || value === 'true');

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  API_PUBLIC_URL: z.string().url(),

  DATABASE_URL: z.string().url(),

  STORAGE_ENDPOINT: z.string().url(),
  STORAGE_BUCKET: z.string().trim().min(1),
  STORAGE_ACCESS_KEY_ID: z.string().min(1),
  STORAGE_SECRET_ACCESS_KEY: z.string().min(1),
  STORAGE_REGION: z.string().trim().min(1).default('auto'),

  CLERK_SECRET_KEY: z.string().min(1),
  CLERK_AUTHORIZED_PARTIES: originsSchema,
  DEV_AUTH_ENABLED: booleanEnvSchema.default(false),
  DEV_AUTH_TOKEN: z.string().min(32).optional(),
  DEV_AUTH_SUBJECT: z.string().trim().min(1).optional(),
  CORS_ORIGINS: originsSchema,
  TENANT_BASE_DOMAIN: z.string().trim().min(1).toLowerCase(),

  THROTTLE_TTL_MS: z.coerce.number().int().positive().default(60_000),
  THROTTLE_LIMIT: z.coerce.number().int().positive().default(100),
}).superRefine((env, context) => {
  if (!env.DEV_AUTH_ENABLED) {
    return;
  }

  if (env.NODE_ENV !== 'development') {
    context.addIssue({
      code: 'custom',
      path: ['DEV_AUTH_ENABLED'],
      message: 'DEV_AUTH_ENABLED só pode ser usado em desenvolvimento.',
    });
  }

  if (!env.DEV_AUTH_TOKEN) {
    context.addIssue({
      code: 'custom',
      path: ['DEV_AUTH_TOKEN'],
      message: 'DEV_AUTH_TOKEN é obrigatório quando DEV_AUTH_ENABLED=true.',
    });
  }

  if (!env.DEV_AUTH_SUBJECT) {
    context.addIssue({
      code: 'custom',
      path: ['DEV_AUTH_SUBJECT'],
      message: 'DEV_AUTH_SUBJECT é obrigatório quando DEV_AUTH_ENABLED=true.',
    });
  }
});

export type Env = z.infer<typeof envSchema>;
